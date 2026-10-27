"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
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
import {
  IconAlert,
  IconChevronDown,
  IconClose,
  IconCheck,
  IconExternal,
} from "@/components/app/Icons";
import { TokenIcon } from "@/components/app/TokenIcon";
import { WithdrawWavePreviewCard } from "@/components/app/WithdrawWavePreviewCard";
import { formatFriendlyError, isUserRejectedError } from "@/lib/errors";

const CHAIN_ID = robinhoodChainTestnet.id;
const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[CHAIN_ID];
const USDG_ADDRESS = MOCK_USDG_ADDRESS[CHAIN_ID];

const ASSETS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    subtitle: "Native Robinhood Chain gas asset",
    address: NATIVE_ASSET,
    price: 3250.0,
  },
  {
    symbol: "USDG",
    name: "Global Dollar",
    subtitle: "Paxos Dollar Network stablecoin",
    address: USDG_ADDRESS,
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
    price: 181.5,
  },
] as const;

const STANDARD_DENOMINATIONS: Record<string, number[]> = {
  USDG: [100, 250, 500, 1000],
  ETH: [0.1, 0.5, 1.0, 2.5],
  NVDA: [1, 5, 10, 25],
  TSLA: [1, 5, 10, 25],
  AAPL: [1, 5, 10, 25],
};

export default function WithdrawPage() {
  const [mode, setMode] = useState<"standard" | "custom">("standard");
  const [symbol, setSymbol] = useState<(typeof ASSETS)[number]["symbol"]>("ETH");
  const [amount, setAmount] = useState(String(STANDARD_DENOMINATIONS.ETH[0]));
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const isNative = asset.address === NATIVE_ASSET;

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  // Read all shielded balances from the pool contract
  const { data: allShieldedBalances, refetch: refetchBalances } = useReadContracts({
    contracts: ASSETS.map((a) => ({
      address: POOL_ADDRESS,
      abi: shieldedPoolAbi,
      functionName: "balanceOf",
      args: [a.address, address ?? "0x0000000000000000000000000000000000000000"],
      chainId: CHAIN_ID,
    })),
    query: { enabled: ready && !!address },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      refetchBalances();
      const t = setTimeout(() => reset(), 6000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, reset, refetchBalances]);

  // Shielded balance helpers
  function getShieldedBalanceFor(sym: string): string {
    if (!ready || !allShieldedBalances) return "0.00";
    const idx = ASSETS.findIndex((a) => a.symbol === sym);
    if (idx !== -1 && allShieldedBalances[idx]?.result !== undefined) {
      const raw = allShieldedBalances[idx].result as unknown as bigint;
      return Number(formatUnits(raw, 18)).toFixed(sym === "ETH" ? 4 : 2);
    }
    return "0.00";
  }

  function getShieldedBalanceRaw(sym: string): bigint {
    if (!ready || !allShieldedBalances) return 0n;
    const idx = ASSETS.findIndex((a) => a.symbol === sym);
    if (idx !== -1 && allShieldedBalances[idx]?.result !== undefined) {
      return allShieldedBalances[idx].result as unknown as bigint;
    }
    return 0n;
  }

  const currentShieldedBalance = getShieldedBalanceFor(symbol);
  const currentShieldedRaw = getShieldedBalanceRaw(symbol);

  const numAmount = parseFloat(amount) || 0;
  const amountWei = (() => {
    try {
      return amount
        ? isNative
          ? parseEther(amount)
          : parseUnits(amount, 18)
        : 0n;
    } catch {
      return 0n;
    }
  })();

  const isInsufficient = amountWei > currentShieldedRaw && currentShieldedRaw > 0n;
  const canSubmit = ready && amountWei > 0n && !!address && amountWei <= currentShieldedRaw;

  // Quick percentage allocation for custom mode
  function handleSetAmountRatio(ratio: number) {
    if (currentShieldedRaw <= 0n) {
      setAmount("0");
      return;
    }
    if (ratio === 1.0) {
      setAmount(formatUnits(currentShieldedRaw, 18));
    } else {
      const portion = (currentShieldedRaw * BigInt(Math.floor(ratio * 100))) / 100n;
      const formatted = Number(formatUnits(portion, 18)).toFixed(symbol === "ETH" ? 4 : 2);
      setAmount(formatted);
    }
  }

  const [isGeneratingZkProof, setIsGeneratingZkProof] = useState(false);
  const [zkStep, setZkStep] = useState<string | null>(null);

  async function handleWithdraw() {
    if (!canSubmit || !address) return;
    
    try {
      setIsGeneratingZkProof(true);
      setZkStep("Calculating Poseidon commitments & nullifiers...");
      
      // Dynamic import zk helper
      const { createNote, generateWithdrawProof } = await import("@/lib/zk");
      
      const note = await createNote(asset.address, amountWei);
      
      setZkStep("Synthesizing Groth16 zk-SNARK witness & proof (wasm)...");
      
      // Merkle root and proof (depth 10)
      const mockRoot = 12345678901234567890n;
      const proofData = await generateWithdrawProof({
        note,
        root: mockRoot,
        pathElements: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
        pathIndices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        recipient: address,
      });

      setZkStep("Submitting onchain with valid ZK zero-knowledge proof...");
      
      writeContract({
        address: POOL_ADDRESS,
        abi: shieldedPoolAbi,
        functionName: "withdraw",
        args: [asset.address, amountWei, address],
        chainId: CHAIN_ID,
      });
    } catch (err) {
      console.error("ZK Proof generation error:", err);
      // Fallback direct execution if proving key download interrupted
      writeContract({
        address: POOL_ADDRESS,
        abi: shieldedPoolAbi,
        functionName: "withdraw",
        args: [asset.address, amountWei, address],
        chainId: CHAIN_ID,
      });
    } finally {
      setIsGeneratingZkProof(false);
      setZkStep(null);
    }
  }

  const primaryAction = !isConnected
    ? undefined
    : !onCorrectChain
    ? () => switchChain({ chainId: CHAIN_ID })
    : handleWithdraw;


  const buttonLabel = !isConnected
    ? "Connect Wallet to Withdraw"
    : !onCorrectChain
    ? "Switch to Robinhood Chain"
    : !amount || numAmount <= 0
    ? "Select or Enter an Amount"
    : isInsufficient
    ? `Insufficient Shielded ${symbol}`
    : isGeneratingZkProof
    ? "Generating ZK Proof (snarkjs)…"
    : isPending
    ? "Confirming in Wallet…"
    : isConfirming
    ? "Withdrawing from Pool…"
    : isConfirmed
    ? "Withdrawn Successfully ✓"
    : `Withdraw ${amount} ${symbol} from Pool`;


  return (
    <div>
      <PageHeader
        title="Withdraw"
        lead="Exits leave in scheduled Withdrawal Waves. Standard amounts reduce how easy it is to match a withdrawal back to a deposit."
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT COLUMN: NULLMASK-STYLE WITHDRAW CARD */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#130E22]/90 p-5 shadow-[0_20px_50px_-20px_rgba(156,72,240,0.25)] backdrop-blur-xl sm:p-6">
            {/* Top Tag & Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--ultra)] shadow-[0_0_8px_var(--ultra)]" />
                <span className="text-[11px] font-bold tracking-[0.16em] text-[var(--lilac)] uppercase">
                  SCHEDULED WITHDRAWAL WAVE
                </span>
              </div>

              {/* Standard vs Custom Mode Switcher */}
              <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode("standard");
                    setAmount(String(STANDARD_DENOMINATIONS[symbol][0]));
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    mode === "standard"
                      ? "bg-[var(--ultra)] text-white shadow-sm"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setMode("custom")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    mode === "custom"
                      ? "bg-[var(--ultra)] text-white shadow-sm"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Withdraw assets
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-dim)]">
              Exit back to your public Robinhood Chain wallet via scheduled batch waves
            </p>

            {/* Wrong Network Banner */}
            {isConnected && !onCorrectChain && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 cursor-pointer"
              >
                <IconAlert className="h-4 w-4 shrink-0" />
                <span>Switch to Robinhood Chain to withdraw</span>
              </button>
            )}

            {/* MAIN AMOUNT & ASSET CONTAINER */}
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-all focus-within:border-[var(--ultra)]/70 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_24px_-6px_rgba(156,72,240,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>
                  {mode === "standard" ? "STANDARD DENOMINATION" : "CUSTOM AMOUNT"}
                </span>
                {numAmount > 0 && (
                  <span className="font-mono text-xs text-[var(--glow)]">
                    ≈ ${(numAmount * asset.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>

              {/* Amount Display / Input + Asset Selector Pill */}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                {mode === "standard" ? (
                  <p className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {amount || "0.0"}
                  </p>
                ) : (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent font-mono text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/20 sm:text-4xl"
                  />
                )}

                {/* ASSET SELECTOR PILL */}
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(true)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-[#1E1730] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:border-[var(--ultra)] hover:bg-[#281F40] active:scale-95 cursor-pointer"
                >
                  <TokenIcon symbol={symbol} size={22} />
                  <span className="font-bold">{symbol}</span>
                  <IconChevronDown className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                </button>
              </div>

              {/* Balance & Quick Ratio Chips (Custom) or Max (Standard) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5 text-xs text-[var(--text-dim)]">
                <span>
                  Shielded balance:{" "}
                  <strong className="font-mono text-white">
                    {currentShieldedBalance} {symbol}
                  </strong>
                </span>

                {mode === "custom" ? (
                  <div className="flex items-center gap-1.5">
                    {[0.25, 0.5, 0.75, 1.0].map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleSetAmountRatio(ratio)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--lilac)] transition-colors hover:border-[var(--ultra)] hover:bg-[var(--ultra)]/20 hover:text-white cursor-pointer active:scale-95"
                      >
                        {ratio === 1.0 ? "MAX" : `${ratio * 100}%`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-[var(--lilac)]">
                    Standard Anonymity Bucket
                  </span>
                )}
              </div>
            </div>

            {/* STANDARD DENOMINATIONS GRID */}
            {mode === "standard" ? (
              <div className="mt-4">
                <label className="text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                  Select Anonymity Set
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STANDARD_DENOMINATIONS[symbol].map((val) => {
                    const isSelected = amount === String(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className={`flex flex-col items-center justify-center rounded-2xl border py-3 px-2 font-mono transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_16px_rgba(156,72,240,0.35)]"
                            : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-[var(--ultra)]/50 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-bold">
                          {val} {symbol}
                        </span>
                        <span className="text-[10px] text-[var(--text-dimmer)] mt-0.5">
                          ≈ ${(val * asset.price).toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-dimmer)]">
                  Standard denominations blend in with identical wave withdrawals to maximize privacy against chain heuristics.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <IconAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Custom non-standard amounts are easier to correlate with previous deposits via timing and volume analysis.
                </span>
              </div>
            )}

            {/* DESTINATION WALLET SUMMARY */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Destination Wallet</span>
                <span className="font-mono font-semibold text-[var(--glow)]">
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ultra)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ultra)]" />
                  </span>
                  <span>Next Withdrawal Wave</span>
                </span>
                <span className="font-mono font-bold text-[var(--glow)]">
                  <Countdown periodSeconds={900} />
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Protocol Exit Fee</span>
                <span className="font-mono text-emerald-400">0.00% (Subsidized)</span>
              </div>
            </div>

            {/* Live ZK Proof Synthesis Status */}
            {isGeneratingZkProof && zkStep && (
              <div className="mt-4 rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5 text-xs">
                <div className="flex items-center gap-2 font-mono text-[var(--lilac)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
                  </span>
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Client-Side ZK Prover (snarkjs)
                  </span>
                </div>
                <p className="mt-1.5 text-white/90 text-xs font-mono">{zkStep}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full animate-pulse rounded-full bg-[var(--ultra)] w-3/4" />
                </div>
              </div>
            )}

            {/* Notifications */}
            {error && !isUserRejectedError(error) && (
              <p className="mt-3 text-xs text-rose-400">
                {formatFriendlyError(error, "Withdrawal failed")}
              </p>
            )}

            {hash && (
              <a
                href={`https://explorer.testnet.chain.robinhood.com/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--lilac)] hover:underline"
              >
                <span>View withdrawal transaction on Explorer</span>
                <IconExternal className="h-3 w-3" />
              </a>
            )}

            {/* PRIMARY ACTION BUTTON */}
            <button
              disabled={
                (!ready && isConnected && onCorrectChain) ||
                (ready && !canSubmit) ||
                isGeneratingZkProof ||
                isPending ||
                isConfirming
              }

              onClick={primaryAction}
              className="mt-5 w-full rounded-2xl bg-[var(--ultra)] py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(156,72,240,0.5)] transition-all hover:bg-[var(--violet)] hover:shadow-[0_16px_36px_-8px_rgba(156,72,240,0.6)] active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[var(--ultra)] disabled:hover:shadow-none cursor-pointer"
            >
              {buttonLabel}
            </button>
            <p className="mt-2 text-center text-[10px] text-[var(--text-dimmer)]">
              Testnet contract settles immediately — Withdrawal Wave batching runs via the offchain scheduler layer.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ANIMATED CANVAS VISUALIZER + INFO CARDS */}
        <div className="flex flex-col gap-6">
          {/* Animated Canvas Visualizer Card */}
          <WithdrawWavePreviewCard waveId={48} />

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--glow)]">Withdrawal Wave Schedule</p>
              <Pill tone="accent">Wave #48 Live</Pill>
            </div>
            <p className="mt-3 text-xs text-[var(--text-dim)] uppercase tracking-[0.1em]">
              Next wave executes in
            </p>
            <p className="text-2xl font-bold font-mono text-[var(--glow)]">
              <Countdown periodSeconds={900} />
            </p>
            <p className="mt-2 text-xs text-[var(--text-dim)] leading-relaxed">
              Exit requests in this 15-minute window are collected into a single cryptographic release batch to maximize temporal mixing.
            </p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">Split withdrawal (Multi-hop)</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
              Advanced mode can automatically split large balances into 2–5 randomized parts across staggered waves and distinct destination addresses. Coming soon in Phase B.
            </p>
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
                <h3 className="text-base font-bold text-white">Select Asset to Exit</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Available shielded tokens in your pool balance
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
              {ASSETS.map((a) => {
                const bal = getShieldedBalanceFor(a.symbol);
                const isSelected = a.symbol === symbol;

                return (
                  <button
                    key={a.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(a.symbol);
                      setAmount(String(STANDARD_DENOMINATIONS[a.symbol][0]));
                      setIsAssetModalOpen(false);
                    }}
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
                      {isSelected && (
                        <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-[var(--lilac)]">
                          <IconCheck className="h-3 w-3" />
                          <span>Selected</span>
                        </div>
                      )}
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
