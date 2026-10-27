"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits, isAddress, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Card, PageHeader } from "@/components/app/ui";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import {
  SHIELDED_POOL_ADDRESS,
  MOCK_USDG_ADDRESS,
  MOCK_STOCK_TOKENS,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { TokenIcon } from "@/components/app/TokenIcon";
import { SendTransferPreviewCard } from "@/components/app/SendTransferPreviewCard";
import { formatFriendlyError, isUserRejectedError } from "@/lib/errors";
import {
  IconChevronDown,
  IconClose,
  IconCheck,
  IconAlert,
  IconExternal,
} from "@/components/app/Icons";

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

export default function SendPage() {
  const [symbol, setSymbol] = useState<(typeof ASSETS)[number]["symbol"]>("ETH");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const asset = ASSETS.find((a) => a.symbol === symbol)!;

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
      setAmount("");
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
        ? symbol === "ETH"
          ? parseEther(amount)
          : parseUnits(amount, 18)
        : 0n;
    } catch {
      return 0n;
    }
  })();

  const isSelf = recipient && address && recipient.toLowerCase() === address.toLowerCase();
  const recipientValid = isAddress(recipient);
  const isInsufficient = amountWei > currentShieldedRaw && currentShieldedRaw > 0n;

  const canSubmit =
    ready &&
    amountWei > 0n &&
    recipientValid &&
    !isSelf &&
    amountWei <= currentShieldedRaw;

  // Quick percentage allocation
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

  function handleSend() {
    if (!canSubmit) return;
    writeContract({
      address: POOL_ADDRESS,
      abi: shieldedPoolAbi,
      functionName: "transfer",
      args: [asset.address, recipient as `0x${string}`, amountWei],
      chainId: CHAIN_ID,
    });
  }

  const primaryAction = !isConnected
    ? undefined
    : !onCorrectChain
    ? () => switchChain({ chainId: CHAIN_ID })
    : handleSend;

  const buttonLabel = !isConnected
    ? "Connect Wallet to Transfer"
    : !onCorrectChain
    ? "Switch to Robinhood Chain"
    : !recipient
    ? "Enter Recipient Address"
    : !recipientValid
    ? "Invalid Recipient Address"
    : isSelf
    ? "Cannot Send to Self"
    : !amount || numAmount <= 0
    ? "Enter an Amount"
    : isInsufficient
    ? `Insufficient Shielded ${symbol}`
    : isPending
    ? "Confirming in Wallet…"
    : isConfirming
    ? "Executing Internal Transfer…"
    : isConfirmed
    ? "Transferred Successfully ✓"
    : `Send ${amount} ${symbol} Privately`;

  return (
    <div>
      <PageHeader
        title="Private transfer"
        lead="Move a shielded balance to another address — an internal ledger move inside the pool, the asset itself never leaves the contract."
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT COLUMN: NULLMASK-STYLE PRIVATE TRANSFER CARD */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#130E22]/90 p-5 shadow-[0_20px_50px_-20px_rgba(156,72,240,0.25)] backdrop-blur-xl sm:p-6">
            {/* Top Tag & Header */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--ultra)] shadow-[0_0_8px_var(--ultra)]" />
              <span className="text-[11px] font-bold tracking-[0.16em] text-[var(--lilac)] uppercase">
                INTERNAL POOL TRANSFER
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Private transfer
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-dim)]">
              Move tokens inside the shielded pool with zero public ERC-20 movement
            </p>

            {/* Wrong Network Banner */}
            {isConnected && !onCorrectChain && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 cursor-pointer"
              >
                <IconAlert className="h-4 w-4 shrink-0" />
                <span>Switch to Robinhood Chain to transfer</span>
              </button>
            )}

            {/* 1. RECIPIENT ADDRESS CONTAINER */}
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-all focus-within:border-[var(--ultra)]/70 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_24px_-6px_rgba(156,72,240,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>RECIPIENT ADDRESS</span>
                {recipient && (
                  <span
                    className={`text-[10px] font-bold ${
                      isSelf
                        ? "text-amber-400"
                        : recipientValid
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {isSelf
                      ? "Cannot send to self"
                      : recipientValid
                      ? "Valid Address ✓"
                      : "Invalid address"}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                  placeholder="0x…"
                  className="w-full bg-transparent font-mono text-base font-semibold tracking-tight text-white outline-none placeholder:text-white/20 sm:text-lg"
                />
                {recipient && (
                  <button
                    type="button"
                    onClick={() => setRecipient("")}
                    className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-[var(--text-dim)] hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <p className="mt-2 text-[11px] text-[var(--text-dimmer)]">
                Recipient must be a valid 42-character Ethereum address on Robinhood Chain
              </p>
            </div>

            {/* 2. AMOUNT & ASSET CONTAINER */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-all focus-within:border-[var(--ultra)]/70 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_24px_-6px_rgba(156,72,240,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>AMOUNT TO TRANSFER</span>
                {numAmount > 0 && (
                  <span className="font-mono text-xs text-[var(--glow)]">
                    ≈ ${(numAmount * asset.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>

              {/* Amount Input + Asset Selector Pill */}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent font-mono text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/20 sm:text-4xl"
                />

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

              {/* Balance & Quick Percentage Allocation */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5 text-xs text-[var(--text-dim)]">
                <span>
                  Shielded balance:{" "}
                  <strong className="font-mono text-white">
                    {currentShieldedBalance} {symbol}
                  </strong>
                </span>

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
              </div>
            </div>

            {/* 3. EXECUTION SUMMARY PARAMETERS */}
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Transfer Venue</span>
                <span className="font-semibold text-[var(--glow)]">
                  ShieldedPool (Internal Ledger)
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>External Token Movement</span>
                <span className="font-semibold text-emerald-400">
                  0 (Tokens never leave vault)
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Protocol Transfer Fee</span>
                <span className="font-mono text-emerald-400">0.00% (Free)</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-dim)]">
                <span>Settlement Speed</span>
                <span className="font-mono text-[var(--glow)]">Instant Onchain Ledger Update</span>
              </div>
            </div>

            {/* Error & Feedback */}
            {error && !isUserRejectedError(error) && (
              <p className="mt-3 text-xs text-rose-400">
                {formatFriendlyError(error, "Transfer failed")}
              </p>
            )}

            {hash && (
              <a
                href={`https://explorer.testnet.chain.robinhood.com/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--lilac)] hover:underline"
              >
                <span>View transfer transaction on Explorer</span>
                <IconExternal className="h-3 w-3" />
              </a>
            )}

            {/* PRIMARY ACTION BUTTON */}
            <button
              disabled={
                (!ready && isConnected && onCorrectChain) ||
                (ready && !canSubmit) ||
                isPending ||
                isConfirming
              }
              onClick={primaryAction}
              className="mt-5 w-full rounded-2xl bg-[var(--ultra)] py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(156,72,240,0.5)] transition-all hover:bg-[var(--violet)] hover:shadow-[0_16px_36px_-8px_rgba(156,72,240,0.6)] active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[var(--ultra)] disabled:hover:shadow-none cursor-pointer"
            >
              {buttonLabel}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ANIMATED CANVAS VISUALIZER + EXPLANATION PANELS */}
        <div className="flex flex-col gap-6">
          {/* Animated Canvas Visualizer Card */}
          <SendTransferPreviewCard />

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">What this actually does</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
              Phase A: this calls <code className="text-[var(--lilac)] font-mono">ShieldedPool.transfer()</code>, a plain
              internal ledger move between two addresses inside the contract. The underlying tokens stay safely locked inside the vault; no ERC-20 token transfer events are emitted to the Robinhood Chain mempool.
            </p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">Contract Verification</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
              All shielded balances are custody-free and held inside{" "}
              <code className="text-[var(--lilac)] font-mono">ShieldedPool</code> on Robinhood Chain Testnet.
            </p>
            <Link
              href={`https://explorer.testnet.chain.robinhood.com/address/${POOL_ADDRESS}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--lilac)] hover:underline"
            >
              <span>Inspect ShieldedPool Onchain</span>
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
                <h3 className="text-base font-bold text-white">Select Shielded Asset</h3>
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
                      setAmount("");
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
