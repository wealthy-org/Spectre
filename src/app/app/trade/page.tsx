"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useSwitchChain,
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
import {
  IconExternal,
  IconChevronDown,
  IconClose,
  IconCheck,
  IconAlert,
  IconArrowUpDown,
} from "@/components/app/Icons";
import { TokenIcon } from "@/components/app/TokenIcon";
import { TradeWavePreviewCard } from "@/components/app/TradeWavePreviewCard";

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
const USDG_ADDR = MOCK_USDG_ADDRESS[CHAIN_ID];

const ASSET_ADDRESSES: Record<string, `0x${string}`> = {
  ETH: NATIVE_ASSET,
  USDG: USDG_ADDR,
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

const ASSETS_LIST = [
  {
    symbol: "USDG",
    name: "Global Dollar",
    subtitle: "Paxos Dollar Network stablecoin",
    address: USDG_ADDR,
    price: 1.0,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.NVDA,
    price: 139.38,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.TSLA,
    price: 243.24,
  },
  {
    symbol: "AAPL",
    name: "Apple Inc",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.AAPL,
    price: 181.50,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    subtitle: "Native Robinhood Chain gas asset",
    address: NATIVE_ASSET,
    price: 3250.00,
  },
];

export default function TradePage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  const { isUnlocked, unlock, isDeriving } = usePrivateAccount();

  const [payAsset, setPayAsset] = useState("USDG");
  const [receiveAsset, setReceiveAsset] = useState("NVDA");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [activeIntents, setActiveIntents] = useState<ActiveIntent[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Asset selection modal state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectingField, setSelectingField] = useState<"pay" | "receive">("pay");

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

  // 1. Native ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
    chainId: CHAIN_ID,
    query: { enabled: ready },
  });

  // 2. Read all token balances for asset selector modal and quick % calculations
  const { data: tokenBalancesData, refetch: refetchTokenBalances } = useReadContracts({
    contracts: [
      {
        address: USDG_ADDR as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: CHAIN_ID,
      },
      {
        address: MOCK_STOCK_TOKENS.NVDA as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: CHAIN_ID,
      },
      {
        address: MOCK_STOCK_TOKENS.TSLA as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: CHAIN_ID,
      },
      {
        address: MOCK_STOCK_TOKENS.AAPL as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: CHAIN_ID,
      },
    ],
    query: { enabled: ready && !!address },
  });

  // Pay asset allowance to Wave Manager
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
      refetchEthBalance();
      refetchTokenBalances();

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

  // Balance lookup helper
  function getBalanceFor(sym: string): string {
    if (!ready) return "0.00";
    if (sym === "ETH") {
      return ethBalance ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4) : "0.0000";
    }
    const idx = ["USDG", "NVDA", "TSLA", "AAPL"].indexOf(sym);
    if (idx !== -1 && tokenBalancesData && tokenBalancesData[idx]?.result !== undefined) {
      const raw = tokenBalancesData[idx].result as bigint;
      return Number(formatUnits(raw, 18)).toFixed(2);
    }
    return "0.00";
  }

  const availablePayBalance = getBalanceFor(payAsset);

  // Quick percentage allocation
  function handleSetPayRatio(ratio: number) {
    if (isNativePay) {
      if (!ethBalance || ethBalance.value === 0n) return;
      const gasReserve = parseEther("0.002");
      const avail = ethBalance.value > gasReserve ? ethBalance.value - gasReserve : 0n;
      if (avail <= 0n) {
        setAmount("0");
        return;
      }
      if (ratio === 1.0) {
        setAmount(Number(formatUnits(avail, 18)).toFixed(4));
      } else {
        const portion = (avail * BigInt(Math.floor(ratio * 100))) / 100n;
        setAmount(Number(formatUnits(portion, 18)).toFixed(4));
      }
    } else {
      const balStr = getBalanceFor(payAsset);
      const num = parseFloat(balStr) || 0;
      if (num <= 0) {
        setAmount("0");
        return;
      }
      const portion = num * ratio;
      setAmount(portion.toFixed(2));
    }
  }

  function handleSwapDirection() {
    const prevPay = payAsset;
    const prevRec = receiveAsset;
    setPayAsset(prevRec);
    setReceiveAsset(prevPay);
  }

  function handleSelectAsset(selectedSymbol: string) {
    if (selectingField === "pay") {
      if (selectedSymbol === receiveAsset) {
        setReceiveAsset(payAsset);
      }
      setPayAsset(selectedSymbol);
    } else {
      if (selectedSymbol === payAsset) {
        setPayAsset(receiveAsset);
      }
      setReceiveAsset(selectedSymbol);
    }
    setIsAssetModalOpen(false);
  }

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

  const primaryAction = !isConnected
    ? undefined
    : !onCorrectChain
    ? () => switchChain({ chainId: CHAIN_ID })
    : needsApproval
    ? handleApprove
    : handleSubmitTrade;

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

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT COLUMN: NULLMASK-STYLE PRIVATE TRADE CARD */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#130E22]/90 p-5 shadow-[0_20px_50px_-20px_rgba(156,72,240,0.25)] backdrop-blur-xl sm:p-6">
            {/* Top Tag & Header */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--ultra)] shadow-[0_0_8px_var(--ultra)]" />
              <span className="text-[11px] font-bold tracking-[0.16em] text-[var(--lilac)] uppercase">
                BATCH AUCTION
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Private trade
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-dim)]">
              Zero frontrunning, zero MEV sandwiching, and uniform wave clearing
            </p>

            {/* Wrong Network Banner */}
            {isConnected && !onCorrectChain && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <IconAlert className="h-4 w-4 shrink-0" />
                <span>Switch to Robinhood Chain to trade</span>
              </button>
            )}

            {/* 1. YOU PAY CONTAINER */}
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-all focus-within:border-[var(--ultra)]/70 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_24px_-6px_rgba(156,72,240,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>YOU PAY</span>
                {numAmount > 0 && (
                  <span className="font-mono text-xs text-[var(--glow)]">
                    ≈ ${(numAmount * payPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>

              {/* Amount Input + Pay Asset Selector Pill */}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent font-mono text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/20 sm:text-4xl"
                />

                {/* ASSET SELECTOR PILL (PAY) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectingField("pay");
                    setIsAssetModalOpen(true);
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-[#1E1730] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:border-[var(--ultra)] hover:bg-[#281F40] active:scale-95 cursor-pointer"
                >
                  <TokenIcon symbol={payAsset} size={22} />
                  <span className="font-bold">{payAsset}</span>
                  <IconChevronDown className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                </button>
              </div>

              {/* Balance & Quick Percentage Allocation */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5 text-xs text-[var(--text-dim)]">
                <span>
                  In wallet:{" "}
                  <strong className="font-mono text-white">
                    {availablePayBalance} {payAsset}
                  </strong>
                </span>

                <div className="flex items-center gap-1.5">
                  {[0.25, 0.5, 0.75, 1.0].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => handleSetPayRatio(ratio)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--lilac)] transition-colors hover:border-[var(--ultra)] hover:bg-[var(--ultra)]/20 hover:text-white cursor-pointer active:scale-95"
                    >
                      {ratio === 1.0 ? "MAX" : `${ratio * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SWAP DIRECTION BUTTON */}
            <div className="relative my-2.5 flex justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <button
                type="button"
                onClick={handleSwapDirection}
                className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1E1730] text-[var(--lilac)] shadow-lg transition-all hover:scale-110 hover:border-[var(--ultra)] hover:bg-[#281F40] hover:text-white active:scale-95 cursor-pointer"
                title="Swap pay and receive assets"
              >
                <IconArrowUpDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
            </div>

            {/* 2. YOU RECEIVE (EST.) CONTAINER */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.025] p-4 transition-all">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>YOU RECEIVE (EST.)</span>
                <span className="text-[10px] font-semibold text-[var(--lilac)]">
                  Uniform Clearing Price
                </span>
              </div>

              {/* Output Display + Receive Asset Selector Pill */}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <p className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  ≈ {estOutput > 0 ? (estOutput < 0.0001 ? estOutput.toExponential(4) : estOutput.toFixed(4)) : "0.0"}
                </p>

                {/* ASSET SELECTOR PILL (RECEIVE) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectingField("receive");
                    setIsAssetModalOpen(true);
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-[#1E1730] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:border-[var(--ultra)] hover:bg-[#281F40] active:scale-95 cursor-pointer"
                >
                  <TokenIcon symbol={receiveAsset} size={22} />
                  <span className="font-bold">{receiveAsset}</span>
                  <IconChevronDown className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                </button>
              </div>

              {/* Price Conversion & Minimum Received Floor */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5 text-xs text-[var(--text-dim)]">
                <span>
                  1 {receiveAsset} ≈{" "}
                  <strong className="font-mono text-white">
                    ${recPrice.toLocaleString()} USD
                  </strong>
                </span>
                <span className="font-mono text-[11px] text-[var(--text-dimmer)]">
                  Floor:{" "}
                  <strong className="text-[var(--glow)]">
                    {minOutput > 0 ? `${minOutput.toFixed(4)} ${receiveAsset}` : "—"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Slippage Tolerance Selector */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs">
              <span className="text-[var(--text-dim)]">Slippage Tolerance (Brief §31)</span>
              <div className="flex gap-1.5">
                {["0.1", "0.5", "1.0"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlippage(s)}
                    className={`rounded-lg px-2.5 py-1 font-mono font-semibold transition-all cursor-pointer active:scale-95 ${
                      slippage === s
                        ? "bg-[var(--ultra)] text-white shadow-[0_0_12px_rgba(156,72,240,0.35)]"
                        : "bg-white/5 text-[var(--text-dim)] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            {/* Wave Execution Parameters Accordion */}
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Execution Venue</span>
                <span className="font-semibold text-[var(--glow)]">
                  Robinhood Chain (Wave #{activeWaveNum})
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ultra)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ultra)]" />
                  </span>
                  <span>Wave Closes In</span>
                </span>
                <span className="font-mono font-bold text-[var(--glow)]">
                  <Countdown periodSeconds={120} />
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Minimum Received Floor</span>
                <span className="font-mono text-[var(--glow)]">
                  {minOutput > 0 ? `${minOutput.toFixed(4)} ${receiveAsset}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Estimated Netting Fee</span>
                <span className="font-semibold text-emerald-400">
                  0.05% Matched / 0.15% Imbalance
                </span>
              </div>
            </div>

            {/* Notifications */}
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

            {/* PRIMARY ACTION BUTTON */}
            <button
              onClick={primaryAction}
              disabled={
                (!ready && isConnected && onCorrectChain) ||
                (ready && (!amount || numAmount <= 0)) ||
                isPending ||
                isConfirming ||
                isDeriving
              }
              className="mt-5 w-full rounded-2xl bg-[var(--ultra)] py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(156,72,240,0.5)] transition-all hover:bg-[var(--violet)] hover:shadow-[0_16px_36px_-8px_rgba(156,72,240,0.6)] active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[var(--ultra)] disabled:hover:shadow-none cursor-pointer"
            >
              {buttonLabel}
            </button>
          </div>

          {/* ACTIVE INTENTS QUEUE */}
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

        {/* RIGHT COLUMN: ANIMATED HOW BATCH WAVES EXECUTE + INFO CARDS */}
        <div className="flex flex-col gap-6">
          {/* Animated Canvas Visualizer Card */}
          <TradeWavePreviewCard waveId={activeWaveNum} />

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

      {/* ASSET SELECTOR POPUP MODAL */}
      {isAssetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsAssetModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#140F24] p-5 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Select {selectingField === "pay" ? "Payment" : "Receive"} Asset
                </h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Available tokens on Robinhood Chain Testnet
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-dim)] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            {/* Asset List */}
            <div className="mt-3 divide-y divide-white/5">
              {ASSETS_LIST.map((a) => {
                const bal = getBalanceFor(a.symbol);
                const currentSelected = selectingField === "pay" ? payAsset : receiveAsset;
                const oppositeSelected = selectingField === "pay" ? receiveAsset : payAsset;
                const isSelected = a.symbol === currentSelected;
                const isOpposite = a.symbol === oppositeSelected;

                return (
                  <button
                    key={a.symbol}
                    type="button"
                    onClick={() => handleSelectAsset(a.symbol)}
                    className={`flex w-full items-center justify-between px-3 py-3 rounded-2xl transition-all hover:bg-white/10 active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? "bg-[var(--ultra)]/15 border border-[var(--ultra)]/60 shadow-[0_0_16px_rgba(156,72,240,0.2)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={a.symbol} size={36} />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {a.symbol}
                          </span>
                          <span className="text-xs text-[var(--text-dimmer)]">
                            {a.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)]">
                          ≈ ${a.price.toLocaleString()} USD
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-white">
                        {bal}
                      </span>
                      {isSelected ? (
                        <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-[var(--lilac)]">
                          <IconCheck className="h-3 w-3" />
                          <span>Selected</span>
                        </div>
                      ) : isOpposite ? (
                        <p className="text-[10px] text-[var(--text-dimmer)]">
                          Swap with {oppositeSelected}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
