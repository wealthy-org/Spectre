"use client";

import { useEffect, useState } from "react";
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
import { Card, PageHeader } from "@/components/app/ui";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import { erc20Abi } from "@/lib/abi/ERC20";
import {
  SHIELDED_POOL_ADDRESS,
  MOCK_USDG_ADDRESS,
  MOCK_STOCK_TOKENS,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { TokenIcon } from "@/components/app/TokenIcon";
import { ShieldPreviewCard } from "@/components/app/ShieldPreviewCard";
import { formatFriendlyError, isUserRejectedError } from "@/lib/errors";
import {
  IconChevronDown,
  IconClose,
  IconAlert,
  IconCheck,
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
    live: true,
    faucetAmount: null,
  },
  {
    symbol: "USDG",
    name: "Global Dollar",
    subtitle: "Paxos Dollar Network stablecoin",
    address: USDG_ADDRESS,
    live: true,
    faucetAmount: "1000",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.NVDA,
    live: true,
    faucetAmount: "10",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.TSLA,
    live: true,
    faucetAmount: "10",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc",
    subtitle: "Synthetic private stock token",
    address: MOCK_STOCK_TOKENS.AAPL,
    live: true,
    faucetAmount: "10",
  },
] as const;

const PRESETS: Record<string, string[]> = {
  ETH: ["0.05", "0.1", "0.5", "1.0"],
  USDG: ["100", "250", "500", "1000"],
  NVDA: ["1", "5", "10", "25"],
  TSLA: ["1", "5", "10", "25"],
  AAPL: ["1", "5", "10", "25"],
};

export default function ShieldPage() {
  const [symbol, setSymbol] = useState<(typeof ASSETS)[number]["symbol"]>("ETH");
  const [amount, setAmount] = useState("");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [prepayWithdrawal, setPrepayWithdrawal] = useState(true);
  const [prepayNetwork, setPrepayNetwork] = useState(true);

  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const isNative = asset.address === NATIVE_ASSET;
  const isLive = asset.live;

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  // 1. Native ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
    chainId: CHAIN_ID,
    query: { enabled: ready },
  });

  // 2. Read all token balances for the modal popup list
  const { data: tokenBalancesData, refetch: refetchTokenBalances } = useReadContracts({
    contracts: [
      {
        address: USDG_ADDRESS as `0x${string}`,
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

  // Active token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: (asset.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", POOL_ADDRESS],
    chainId: CHAIN_ID,
    query: { enabled: ready && !isNative && !!asset.address },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const amountWei = (() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  })();

  const needsApproval = !isNative && amountWei > 0n && (allowance ?? 0n) < amountWei;

  useEffect(() => {
    if (isConfirmed) {
      setAmount("");
      refetchAllowance();
      refetchEthBalance();
      refetchTokenBalances();
      const t = setTimeout(() => reset(), 6000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, reset, refetchAllowance, refetchEthBalance, refetchTokenBalances]);

  // Helper to format balance for any symbol
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

  const currentAvailableBalance = getBalanceFor(symbol);

  function handleSetMax() {
    if (isNative) {
      if (!ethBalance || ethBalance.value === 0n) return;
      // Leave 0.002 ETH for gas
      const gasBuffer = parseEther("0.002");
      const maxVal = ethBalance.value > gasBuffer ? ethBalance.value - gasBuffer : 0n;
      setAmount(formatUnits(maxVal, ethBalance.decimals));
    } else {
      setAmount(currentAvailableBalance);
    }
  }

  const canSubmit = isLive && ready && amountWei > 0n;

  function handleFaucet() {
    if (!asset.address || isNative || !asset.faucetAmount) return;
    writeContract({
      address: asset.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "faucet",
      args: [parseUnits(asset.faucetAmount, 18)],
      chainId: CHAIN_ID,
    });
  }

  function handleApprove() {
    if (!ready || isNative || !asset.address) return;
    writeContract({
      address: asset.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [POOL_ADDRESS, 2n ** 256n - 1n],
      chainId: CHAIN_ID,
    });
  }

  function handleShield() {
    if (!canSubmit) return;
    if (isNative) {
      writeContract({
        address: POOL_ADDRESS,
        abi: shieldedPoolAbi,
        functionName: "depositNative",
        args: [],
        value: parseEther(amount),
        chainId: CHAIN_ID,
      });
    } else if (asset.address) {
      writeContract({
        address: POOL_ADDRESS,
        abi: shieldedPoolAbi,
        functionName: "deposit",
        args: [asset.address as `0x${string}`, amountWei],
        chainId: CHAIN_ID,
      });
    }
  }

  const primaryAction = !isConnected
    ? undefined
    : !onCorrectChain
    ? () => switchChain({ chainId: CHAIN_ID })
    : needsApproval
    ? handleApprove
    : handleShield;

  const buttonLabel = !isConnected
    ? "Connect Wallet to Shield"
    : !onCorrectChain
    ? "Switch to Robinhood Chain"
    : !isLive
    ? `${symbol} Not Supported Yet`
    : isPending
    ? "Confirming in Wallet…"
    : isConfirming
    ? needsApproval
      ? "Approving Token…"
      : "Shielding into Pool…"
    : isConfirmed
    ? "Deposited Successfully ✓"
    : needsApproval
    ? `Approve ${symbol} for Pool`
    : "Shield Tokens";

  return (
    <div>
      <PageHeader
        title="Shield assets"
        lead="Deposit into the shared shielded pool. The deposit itself is a public onchain action — privacy comes from what happens after."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT COLUMN: NULLMASK-STYLE SHIELD CARD */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#130E22]/90 p-5 shadow-[0_20px_50px_-20px_rgba(156,72,240,0.25)] backdrop-blur-xl sm:p-6">
            {/* Top Tag & Header */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--ultra)] shadow-[0_0_8px_var(--ultra)]" />
              <span className="text-[11px] font-bold tracking-[0.16em] text-[var(--lilac)] uppercase">
                DEPOSIT
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Shield tokens
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-dim)]">
              Move tokens into Spectre for private onchain execution
            </p>

            {/* Wrong Network Banner */}
            {isConnected && !onCorrectChain && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <IconAlert className="h-4 w-4 shrink-0" />
                <span>Switch to Robinhood Chain to shield</span>
              </button>
            )}

            {/* MAIN INPUT CONTAINER */}
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.035] p-4 transition-all focus-within:border-[var(--ultra)]/70 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_24px_-6px_rgba(156,72,240,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                <span>IN THE POOL YOU GET</span>
                <span
                  className="cursor-help text-xs text-[var(--text-dimmer)] hover:text-white"
                  title="Your deposit mints a private shielded balance 1:1 inside the pool"
                >
                  ⓘ
                </span>
              </div>

              {/* Amount Input + Asset Selector Pill */}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  disabled={!isLive}
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

              {/* Balance & Max Button */}
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-[var(--text-dim)]">
                <span>
                  In your wallet:{" "}
                  <strong className="font-mono text-white">
                    {currentAvailableBalance} {symbol}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="font-mono text-[11px] font-bold text-[var(--lilac)] transition-colors hover:text-white hover:underline"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PRESETS[symbol]?.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-xl border py-2 text-xs font-semibold font-mono transition-all active:scale-95 ${
                    amount === p
                      ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-[var(--glow)] shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                      : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-[var(--ultra)]/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Testnet Faucet Quick Action */}
            {isLive && !isNative && asset.faucetAmount && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--ultra)]/30 bg-[var(--ultra)]/10 px-3.5 py-2 text-xs text-[var(--glow)]">
                <span className="text-[var(--text-dim)]">
                  Need test {asset.symbol}? Free testnet tokens available.
                </span>
                <button
                  type="button"
                  onClick={handleFaucet}
                  disabled={!ready || isPending || isConfirming}
                  className="font-semibold text-[var(--lilac)] hover:text-white hover:underline disabled:opacity-40"
                >
                  Mint +{asset.faucetAmount} {asset.symbol} →
                </button>
              </div>
            )}

            {/* PREPAY FEE TOGGLES */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs text-[var(--text-dim)]">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-dimmer)]">
                PREPAY
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prepayWithdrawal}
                    onChange={(e) => setPrepayWithdrawal(e.target.checked)}
                    className="accent-[var(--ultra)] h-3.5 w-3.5 cursor-pointer rounded"
                  />
                  <span>Withdrawal fee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prepayNetwork}
                    onChange={(e) => setPrepayNetwork(e.target.checked)}
                    className="accent-[var(--ultra)] h-3.5 w-3.5 cursor-pointer rounded"
                  />
                  <span>Network fee</span>
                </label>
                <span className="text-xs text-[var(--text-dimmer)]" title="Fees are subsidized on Robinhood Chain testnet">ⓘ</span>
              </div>
            </div>

            {/* Total from your wallet dropdown accordion */}
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-[var(--text-dim)] transition-colors hover:text-white"
              >
                <span>Total from your wallet: <strong className="text-white font-mono">{amount || "0.0"} {symbol}</strong></span>
                <IconChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDetailsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isDetailsOpen && (
                <div className="space-y-1.5 border-t border-white/5 bg-black/20 px-4 py-3 text-xs text-[var(--text-dim)]">
                  <div className="flex justify-between">
                    <span>Protocol Deposit Fee</span>
                    <span className="font-mono text-emerald-400">0.0% (Zero Fee)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Contract</span>
                    <a
                      href={`https://explorer.testnet.chain.robinhood.com/address/${POOL_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[var(--lilac)] hover:underline"
                    >
                      {POOL_ADDRESS.slice(0, 6)}…{POOL_ADDRESS.slice(-4)} ↗
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span>Private Output</span>
                    <span className="font-mono text-white">
                      {amount || "0.0"} {symbol} in Shielded Pool
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN ACTION BUTTON */}
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

            {/* Notifications */}
            {needsApproval && (
              <p className="mt-2 text-center text-[11px] text-[var(--text-dimmer)]">
                ERC-20s require a one-time token approval before depositing into the pool.
              </p>
            )}
            {error && !isUserRejectedError(error) && (
              <p className="mt-3 text-xs text-rose-400">
                {formatFriendlyError(error, "Deposit failed")}
              </p>
            )}
            {hash && (
              <a
                href={`https://explorer.testnet.chain.robinhood.com/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--lilac)] hover:underline"
              >
                <span>View transaction on Robinhood Explorer</span>
                <IconExternal className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ANIMATED HOW IT ENTERS PREVIEW CARD */}
        <div className="flex flex-col gap-6">
          <ShieldPreviewCard />

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">
              How shielding works
            </p>
            <ol className="mt-3 space-y-3 text-sm text-[var(--text-dim)]">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  1
                </span>
                <span>Connect your wallet on Robinhood Chain Testnet.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  2
                </span>
                <span>
                  Approve ERC-20s (NVDA, TSLA, AAPL, USDG) or deposit ETH directly.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  3
                </span>
                <span>
                  Your assets enter the pool and can be traded privately across periodic Trade Waves.
                </span>
              </li>
            </ol>
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
                <h3 className="text-base font-bold text-white">Select an Asset</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Available tokens on Robinhood Chain Testnet
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-dim)] hover:bg-white/10 hover:text-white"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            {/* Asset List */}
            <div className="mt-3 divide-y divide-white/5">
              {ASSETS.map((a) => {
                const bal = getBalanceFor(a.symbol);
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
                    className={`flex w-full items-center justify-between px-3 py-3 rounded-2xl transition-all hover:bg-white/10 active:scale-[0.99] ${
                      isSelected ? "bg-[var(--ultra)]/15 border border-[var(--ultra)]/60 shadow-[0_0_16px_rgba(156,72,240,0.2)]" : ""
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
                          {a.subtitle}
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
