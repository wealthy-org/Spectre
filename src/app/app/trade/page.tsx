"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { usePrivateAccount } from "@/lib/private-account";
import {
  MOCK_USDG_ADDRESS,
  MOCK_STOCK_TOKENS,
  TRADE_WAVE_MANAGER_ADDRESS,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { tradeWaveManagerAbi } from "@/lib/abi/TradeWaveManager";
import { erc20Abi } from "@/lib/abi/ERC20";
import { IconExternal } from "@/components/app/Icons";

interface ActiveIntent {
  id: string;
  waveId: number;
  paySymbol: string;
  payAmount: string;
  receiveSymbol: string;
  estReceive: string;
  minReceive: string;
  slippage: string;
  status: "Committed" | "Netting" | "Settled";
  timestamp: string;
  txHash?: string;
}

const CHAIN_ID = robinhoodChainTestnet.id;
const WAVE_MANAGER_ADDR = TRADE_WAVE_MANAGER_ADDRESS[CHAIN_ID];

const ASSET_ADDRESSES: Record<string, `0x${string}`> = {
  ETH: NATIVE_ASSET,
  USDG: MOCK_USDG_ADDRESS[CHAIN_ID],
  NVDA: MOCK_STOCK_TOKENS.NVDA,
  TSLA: MOCK_STOCK_TOKENS.TSLA,
  AAPL: MOCK_STOCK_TOKENS.AAPL,
};

const REFERENCE_PRICES: Record<string, number> = {
  USDG: 1,
  NVDA: 139.38,
  TSLA: 243.24,
  AAPL: 181.50,
  ETH: 3250.00,
};

export default function TradePage() {
  const { address, isConnected, chainId } = useAccount();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  const { isUnlocked, unlock, isDeriving } = usePrivateAccount();

  const [payAsset, setPayAsset] = useState("USDG");
  const [receiveAsset, setReceiveAsset] = useState("NVDA");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [activeIntents, setActiveIntents] = useState<ActiveIntent[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const payAssetAddr = ASSET_ADDRESSES[payAsset];
  const recAssetAddr = ASSET_ADDRESSES[receiveAsset];
  const isNativePay = payAsset === "ETH";

  // Read current onchain wave ID from TradeWaveManager
  const { data: currentWaveIdData } = useReadContract({
    address: WAVE_MANAGER_ADDR,
    abi: tradeWaveManagerAbi,
    functionName: "currentWaveId",
    chainId: CHAIN_ID,
    query: { enabled: ready, refetchInterval: 12000 },
  });
  const activeWaveNum = currentWaveIdData ? Number(currentWaveIdData) : 1;

  // Pay asset balances & allowance
  const { data: ethPayBalance } = useBalance({
    address,
    chainId: CHAIN_ID,
    query: { enabled: ready && isNativePay },
  });

  const { data: tokenPayBalance, refetch: refetchTokenPayBalance } = useReadContract({
    address: payAssetAddr,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: ready && !isNativePay && !!payAssetAddr },
  });

  const { data: payAllowance, refetch: refetchPayAllowance } = useReadContract({
    address: payAssetAddr,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", WAVE_MANAGER_ADDR],
    chainId: CHAIN_ID,
    query: { enabled: ready && !isNativePay && !!payAssetAddr },
  });

  const { writeContract, data: hash, isPending, error: txError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const numAmount = parseFloat(amount) || 0;
  const payPrice = REFERENCE_PRICES[payAsset] || 1;
  const recPrice = REFERENCE_PRICES[receiveAsset] || 1;

  // Estimated output
  const estOutput = numAmount > 0 ? (numAmount * payPrice) / recPrice : 0;
  const slippageFraction = (parseFloat(slippage) || 0.5) / 100;
  const minOutput = estOutput * (1 - slippageFraction);

  const amountWei = (() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  })();

  const needsApproval = ready && !isNativePay && amountWei > 0n && (payAllowance ?? 0n) < amountWei;

  useEffect(() => {
    if (isConfirmed && hash) {
      const intentId = `INT-${hash.slice(2, 6).toUpperCase()}`;
      const newIntent: ActiveIntent = {
        id: intentId,
        waveId: activeWaveNum,
        paySymbol: payAsset,
        payAmount: amount,
        receiveSymbol: receiveAsset,
        estReceive: estOutput.toFixed(4),
        minReceive: minOutput.toFixed(4),
        slippage: `${slippage}%`,
        status: "Committed",
        timestamp: "Confirmed onchain",
        txHash: hash,
      };

      setActiveIntents((prev) => [newIntent, ...prev]);
      setSuccessMsg(`Intent #${intentId} committed to Wave #${activeWaveNum} on Robinhood Chain!`);
      setAmount("");
      refetchPayAllowance();
      refetchTokenPayBalance();

      // Lifecycle progression simulation
      setTimeout(() => {
        setActiveIntents((prev) =>
          prev.map((i) => (i.id === intentId ? { ...i, status: "Netting" } : i))
        );
      }, 8000);

      setTimeout(() => {
        setActiveIntents((prev) =>
          prev.map((i) => (i.id === intentId ? { ...i, status: "Settled" } : i))
        );
      }, 16000);

      const t = setTimeout(() => reset(), 8000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, hash]);

  function handleApprove() {
    if (!ready || isNativePay || !payAssetAddr) return;
    writeContract({
      address: payAssetAddr,
      abi: erc20Abi,
      functionName: "approve",
      args: [WAVE_MANAGER_ADDR, 2n ** 256n - 1n],
      chainId: CHAIN_ID,
    });
  }

  async function handleSubmitTrade() {
    if (!amount || numAmount <= 0) return;

    if (!isUnlocked) {
      await unlock();
    }

    if (needsApproval) {
      handleApprove();
      return;
    }

    const minAmountWei = parseUnits(minOutput.toFixed(6), 18);

    if (ready) {
      writeContract({
        address: WAVE_MANAGER_ADDR,
        abi: tradeWaveManagerAbi,
        functionName: "submitIntent",
        args: [payAssetAddr, recAssetAddr, amountWei, minAmountWei],
        value: isNativePay ? amountWei : 0n,
        chainId: CHAIN_ID,
      });
    } else {
      // Fallback offline simulator
      const simId = `INT-${Date.now().toString().slice(-4)}`;
      const simIntent: ActiveIntent = {
        id: simId,
        waveId: activeWaveNum,
        paySymbol: payAsset,
        payAmount: amount,
        receiveSymbol: receiveAsset,
        estReceive: estOutput.toFixed(4),
        minReceive: minOutput.toFixed(4),
        slippage: `${slippage}%`,
        status: "Committed",
        timestamp: "Just now",
      };
      setActiveIntents((prev) => [simIntent, ...prev]);
      setSuccessMsg(`Intent #${simId} committed to Wave #${activeWaveNum}!`);
      setAmount("");
    }
  }

  const availableText = isNativePay
    ? ready && ethPayBalance
      ? `${Number(formatUnits(ethPayBalance.value, ethPayBalance.decimals)).toFixed(4)} ETH`
      : "0.0000 ETH"
    : ready && tokenPayBalance !== undefined
    ? `${Number(formatUnits(tokenPayBalance, 18)).toFixed(2)} ${payAsset}`
    : `0.00 ${payAsset}`;

  const buttonLabel = !isConnected
    ? "Connect Wallet to Trade"
    : !onCorrectChain
    ? "Switch to Robinhood Chain"
    : isPending
    ? "Confirming in Wallet…"
    : isConfirming
    ? needsApproval
      ? "Approving Token…"
      : "Submitting Intent to Wave…"
    : !amount || numAmount <= 0
    ? "Enter an Amount"
    : needsApproval
    ? `Approve ${payAsset} for Wave`
    : !isUnlocked
    ? "Derive Shield Key & Submit Intent"
    : `Submit Intent to Wave #${activeWaveNum}`;

  return (
    <div>
      <PageHeader
        title="Private trade"
        lead="Submit a private trade intent for the next Trade Wave. Intents accumulate into scheduled windows, net internally, and settle together rather than executing one by one."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            {/* Pay Asset Row */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                You pay
              </label>
              <select
                value={payAsset}
                onChange={(e) => {
                  const val = e.target.value;
                  setPayAsset(val);
                  if (val === receiveAsset) {
                    setReceiveAsset(val === "NVDA" ? "USDG" : "NVDA");
                  }
                }}
                className="rounded-lg border border-white/15 bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--glow)] outline-none"
              >
                {Object.keys(REFERENCE_PRICES).map((t) => (
                  <option key={t} value={t}>
                    {t} (${REFERENCE_PRICES[t].toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--app-border-strong)] px-4 py-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full bg-transparent text-2xl font-semibold text-[var(--glow)] outline-none placeholder:text-[var(--text-dimmer)]"
              />
              <span className="text-sm font-semibold text-[var(--text-dim)]">{payAsset}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-[var(--text-dimmer)]">
              <span>Available in wallet: {availableText}</span>
              {numAmount > 0 && <span>≈ ${(numAmount * payPrice).toLocaleString()}</span>}
            </div>

            <div className="my-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const prevPay = payAsset;
                  setPayAsset(receiveAsset);
                  setReceiveAsset(prevPay);
                }}
                className="rounded-full border border-white/15 p-2 text-[rgba(235,221,255,.6)] transition-colors hover:border-[var(--ultra)] hover:text-white cursor-pointer"
                title="Swap direction"
              >
                ⇅
              </button>
            </div>

            {/* Receive Asset Row */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                You receive (est.)
              </label>
              <select
                value={receiveAsset}
                onChange={(e) => {
                  const val = e.target.value;
                  setReceiveAsset(val);
                  if (val === payAsset) {
                    setPayAsset(val === "USDG" ? "ETH" : "USDG");
                  }
                }}
                className="rounded-lg border border-white/15 bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--glow)] outline-none"
              >
                {Object.keys(REFERENCE_PRICES).map((t) => (
                  <option key={t} value={t}>
                    {t} (${REFERENCE_PRICES[t].toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-2 text-3xl font-semibold text-[var(--glow)]">
              ≈ {estOutput > 0 ? estOutput.toFixed(4) : "0.0"} {receiveAsset}
            </p>

            {/* Slippage Selector */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-dim)]">Slippage Tolerance (Brief §31)</span>
                <div className="flex gap-1.5">
                  {["0.1", "0.5", "1.0"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlippage(s)}
                      className={`rounded px-2 py-1 font-semibold transition-colors cursor-pointer ${
                        slippage === s
                          ? "bg-[var(--ultra)] text-white"
                          : "bg-white/10 text-[var(--text-dim)] hover:text-white"
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Wave Execution Parameters */}
            <div className="mt-5 space-y-2 rounded-xl bg-white/5 p-4 text-xs">
              <div className="flex justify-between text-[rgba(235,221,255,.7)]">
                <span>Execution Venue</span>
                <span className="text-[var(--glow)] font-semibold">
                  Robinhood Chain (Wave #{activeWaveNum})
                </span>
              </div>
              <div className="flex justify-between text-[rgba(235,221,255,.7)]">
                <span>Wave Closes In</span>
                <span className="font-mono text-[var(--glow)] font-semibold">
                  <Countdown periodSeconds={120} />
                </span>
              </div>
              <div className="flex justify-between text-[rgba(235,221,255,.7)]">
                <span>Minimum Received Floor</span>
                <span className="font-mono text-[var(--glow)]">
                  {minOutput > 0 ? `${minOutput.toFixed(4)} ${receiveAsset}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-[rgba(235,221,255,.7)]">
                <span>Estimated Netting Fee</span>
                <span className="text-[var(--glow)]">0.05% Matched / 0.15% Imbalance</span>
              </div>
            </div>

            {successMsg && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {successMsg}
              </div>
            )}

            {txError && (
              <p className="mt-3 text-xs text-rose-400">
                {txError.message.split("\n")[0]}
              </p>
            )}

            <button
              onClick={handleSubmitTrade}
              disabled={
                !amount ||
                numAmount <= 0 ||
                isPending ||
                isConfirming ||
                isDeriving ||
                (!isConnected && false)
              }
              className="mt-6 w-full rounded-xl bg-[var(--ultra)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40 cursor-pointer"
            >
              {buttonLabel}
            </button>
          </Card>

          {/* Active Intents Queue */}
          {activeIntents.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--glow)]">Your Active Wave Intents</span>
                <Pill tone="accent">{activeIntents.length} Intent(s)</Pill>
              </div>
              <div className="divide-y divide-white/10 text-xs">
                {activeIntents.map((intent) => (
                  <div key={intent.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--glow)]">{intent.id}</span>
                        <span className="text-[var(--text-dim)]">· Wave #{intent.waveId}</span>
                        {intent.txHash && (
                          <Link
                            href={`https://explorer.testnet.chain.robinhood.com/tx/${intent.txHash}`}
                            target="_blank"
                            className="text-[var(--lilac)] hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Explorer</span>
                            <IconExternal className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-[var(--glow)]">
                        {intent.payAmount} {intent.paySymbol} → {intent.estReceive} {intent.receiveSymbol}
                      </p>
                      <p className="text-[10px] text-[var(--text-dimmer)]">
                        Min Floor: {intent.minReceive} {intent.receiveSymbol} (Slippage: {intent.slippage})
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          intent.status === "Settled"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : intent.status === "Netting"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {intent.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-dimmer)]">{intent.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Info Panels */}
        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">How Trade Waves work</p>
            <ol className="mt-3 space-y-3 text-sm text-[var(--text-dim)]">
              <li className="flex gap-3">
                <Pill tone="muted">1</Pill>
                <span>
                  <strong>Intent Queueing</strong>: Orders arrive during the active wave interval. Order sizes and identities remain shielded.
                </span>
              </li>
              <li className="flex gap-3">
                <Pill tone="muted">2</Pill>
                <span>
                  <strong>Internal Crossing</strong>: Buys and sells in the same asset pair net against each other with zero market impact and 0.05% fee.
                </span>
              </li>
              <li className="flex gap-3">
                <Pill tone="muted">3</Pill>
                <span>
                  <strong>Imbalance Routing</strong>: Only the unmatched net volume is routed to Robinhood Chain liquidity venues, eliminating sandwich attacks.
                </span>
              </li>
            </ol>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">Contract Verification</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
              Trade intents are escrowed in{" "}
              <code className="text-[var(--lilac)] font-mono">TradeWaveManager</code> on Robinhood Chain Testnet. Emergency refund logic ensures funds can be claimed back 1:1 if a wave is ever delayed or cancelled.
            </p>
            <Link
              href={`https://explorer.testnet.chain.robinhood.com/address/${WAVE_MANAGER_ADDR}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--lilac)] hover:underline"
            >
              <span>Inspect TradeWaveManager Onchain</span>
              <IconExternal className="h-3 w-3" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
