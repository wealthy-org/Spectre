"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import {
  SHIELDED_POOL_ADDRESS,
  MOCK_USDG_ADDRESS,
  MOCK_STOCK_TOKENS,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { IconAlert } from "@/components/app/Icons";

const CHAIN_ID = robinhoodChainTestnet.id;
const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[CHAIN_ID];
const USDG_ADDRESS = MOCK_USDG_ADDRESS[CHAIN_ID];

const ASSETS = [
  { symbol: "ETH", address: NATIVE_ASSET },
  { symbol: "USDG", address: USDG_ADDRESS },
  { symbol: "NVDA", address: MOCK_STOCK_TOKENS.NVDA },
  { symbol: "TSLA", address: MOCK_STOCK_TOKENS.TSLA },
  { symbol: "AAPL", address: MOCK_STOCK_TOKENS.AAPL },
] as const;

const STANDARD: Record<string, number[]> = {
  USDG: [250, 500, 1000, 3000],
  ETH: [0.1, 0.5, 1.0],
  NVDA: [1, 5, 10, 25],
  TSLA: [1, 5, 10, 25],
  AAPL: [1, 5, 10, 25],
};

export default function WithdrawPage() {
  const [mode, setMode] = useState<"custom" | "standard">("standard");
  const [symbol, setSymbol] = useState<(typeof ASSETS)[number]["symbol"]>("ETH");
  const [amount, setAmount] = useState("");

  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const isNative = asset.address === NATIVE_ASSET;

  const { address, isConnected, chainId } = useAccount();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  const { data: shieldedBalance, refetch: refetchBalance } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [asset.address, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: ready },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      setAmount("");
      refetchBalance();
      const t = setTimeout(() => reset(), 6000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, reset, refetchBalance]);

  const canSubmit = ready && !!amount && Number(amount) > 0 && !!address;

  function handleWithdraw() {
    if (!canSubmit || !address) return;
    const amountWei = isNative ? parseEther(amount) : parseUnits(amount, 18);
    writeContract({
      address: POOL_ADDRESS,
      abi: shieldedPoolAbi,
      functionName: "withdraw",
      args: [asset.address, amountWei, address],
      chainId: CHAIN_ID,
    });
  }

  const buttonLabel = !isConnected
    ? "Connect wallet to withdraw"
    : !onCorrectChain
    ? "Switch to Robinhood Chain Testnet"
    : isPending
    ? "Confirm in wallet…"
    : isConfirming
    ? "Withdrawing…"
    : isConfirmed
    ? "Withdrawn ✓"
    : "Withdraw now";

  return (
    <div>
      <PageHeader
        title="Withdraw"
        lead="Exits leave in scheduled Withdrawal Waves. Standard amounts reduce how easy it is to match a withdrawal back to a deposit."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <div className="inline-flex rounded-xl bg-white/5 p-1">
            {(["standard", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  mode === m ? "bg-[var(--ultra)] text-white" : "text-[var(--text-dim)]"
                }`}
              >
                {m} amounts
              </button>
            ))}
          </div>

          <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Asset
          </label>
          <div className="mt-2 flex gap-2">
            {ASSETS.map((a) => (
              <button
                key={a.symbol}
                onClick={() => {
                  setSymbol(a.symbol);
                  setAmount("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  symbol === a.symbol
                    ? "bg-[var(--ultra)] text-white"
                    : "border border-[var(--app-border-strong)] text-[var(--text-dim)] hover:border-[var(--ultra)]"
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-dimmer)]">
            Your shielded balance:{" "}
            {ready && shieldedBalance !== undefined
              ? `${formatUnits(shieldedBalance, 18)} ${symbol}`
              : "— connect wallet —"}
          </p>

          {mode === "standard" ? (
            <>
              <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
                Choose an amount
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STANDARD[symbol].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      amount === String(v)
                        ? "border-[var(--ultra)] bg-[var(--ultra)]/15 text-white"
                        : "border-[var(--app-border-strong)] text-[var(--text-dim)] hover:border-[var(--ultra)]"
                    }`}
                  >
                    {v} {symbol}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--text-dimmer)]">
                Common denominations blend in with other withdrawals in the same wave.
              </p>
            </>
          ) : (
            <>
              <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
                Amount
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--app-border-strong)] px-4 py-3">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="w-full bg-transparent text-2xl font-semibold text-[var(--glow)] outline-none placeholder:text-[var(--text-dimmer)]"
                />
                <span className="text-sm font-semibold text-[var(--text-dim)]">{symbol}</span>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-[var(--text-dimmer)]">
                <IconAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>A unique amount is easier to correlate with a specific deposit.</span>
              </p>
            </>
          )}

          <button
            disabled={!canSubmit || isPending || isConfirming}
            onClick={handleWithdraw}
            className="mt-6 w-full rounded-xl bg-[var(--ultra)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40"
          >
            {buttonLabel}
          </button>
          <p className="mt-2 text-center text-[11px] text-[var(--text-dimmer)]">
            Testnet contract settles immediately — Withdrawal Wave batching is
            an offchain scheduler layer not deployed yet (brief §20).
          </p>

          {error && (
            <p className="mt-3 text-xs text-rose-400">{error.message.split("\n")[0]}</p>
          )}
          {hash && (
            <a
              href={`https://explorer.testnet.chain.robinhood.com/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block text-xs text-[var(--lilac)] hover:text-[var(--glow)]"
            >
              View transaction →
            </a>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--glow)]">Withdrawal Wave</p>
              <Pill tone="accent">Live</Pill>
            </div>
            <p className="mt-3 text-xs text-[var(--text-dim)] uppercase tracking-[0.1em]">
              Next wave in
            </p>
            <p className="text-2xl font-bold text-[var(--glow)]">
              <Countdown periodSeconds={900} />
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">Split withdrawal</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
              Advanced mode can split one balance into 2–5 parts across different waves
              and destination addresses. Coming soon.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
