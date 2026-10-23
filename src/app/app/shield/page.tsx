"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Card, PageHeader, Pill } from "@/components/app/ui";
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

const CHAIN_ID = robinhoodChainTestnet.id;
const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[CHAIN_ID];
const USDG_ADDRESS = MOCK_USDG_ADDRESS[CHAIN_ID];

const ASSETS = [
  { symbol: "ETH", address: NATIVE_ASSET, live: true, faucetAmount: null },
  { symbol: "USDG", address: USDG_ADDRESS, live: true, faucetAmount: "1000" },
  { symbol: "NVDA", address: MOCK_STOCK_TOKENS.NVDA, live: true, faucetAmount: "10" },
  { symbol: "TSLA", address: MOCK_STOCK_TOKENS.TSLA, live: true, faucetAmount: "10" },
  { symbol: "AAPL", address: MOCK_STOCK_TOKENS.AAPL, live: true, faucetAmount: "10" },
] as const;

export default function ShieldPage() {
  const [symbol, setSymbol] = useState<(typeof ASSETS)[number]["symbol"]>("ETH");
  const [amount, setAmount] = useState("");

  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const isNative = asset.address === NATIVE_ASSET;
  const isLive = asset.live;

  const { address, isConnected, chainId } = useAccount();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  // native ETH wallet balance (for the ETH row)
  const { data: ethBalance } = useBalance({
    address,
    chainId: CHAIN_ID,
    query: { enabled: ready && isNative },
  });

  // Token wallet balance + allowance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: (asset.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: ready && !isNative && !!asset.address },
  });
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
      refetchTokenBalance();
      const t = setTimeout(() => reset(), 6000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, reset, refetchAllowance, refetchTokenBalance]);

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

  const primaryAction = needsApproval ? handleApprove : handleShield;
  const buttonLabel = !isConnected
    ? "Connect wallet to shield"
    : !onCorrectChain
    ? "Switch to Robinhood Chain Testnet"
    : !isLive
    ? `${symbol} not supported on testnet yet`
    : isPending
    ? "Confirm in wallet…"
    : isConfirming
    ? needsApproval
      ? "Approving…"
      : "Shielding…"
    : isConfirmed
    ? "Done ✓"
    : needsApproval
    ? `Approve ${symbol}`
    : "Shield";

  const available = isNative
    ? ready && ethBalance
      ? `${Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH`
      : "0.0000 ETH"
    : ready && tokenBalance !== undefined
    ? `${Number(formatUnits(tokenBalance, 18)).toFixed(2)} ${symbol}`
    : `0.00 ${symbol}`;

  return (
    <div>
      <PageHeader
        title="Shield assets"
        lead="Deposit into the shared shielded pool. The deposit itself is a public onchain action — privacy comes from what happens after."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <label className="text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Asset
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASSETS.map((a) => (
              <button
                key={a.symbol}
                onClick={() => {
                  setSymbol(a.symbol);
                  setAmount("");
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  symbol === a.symbol
                    ? "bg-[var(--ultra)] text-white"
                    : "border border-[var(--app-border-strong)] text-[var(--text-dim)] hover:border-[var(--ultra)]"
                }`}
              >
                <TokenIcon symbol={a.symbol} size={20} />
                <span>{a.symbol}</span>
              </button>
            ))}
          </div>
          {!isLive && (
            <p className="mt-2 text-xs text-amber-400/90">
              {symbol} needs a real asset deployed on Robinhood Chain first —
              only ETH and the testnet mock USDG are wired right now.
            </p>
          )}
          {isLive && !isNative && asset.faucetAmount && (
            <button
              onClick={handleFaucet}
              disabled={!ready || isPending || isConfirming}
              className="mt-2 text-xs font-semibold text-[var(--lilac)] hover:text-[var(--glow)] disabled:opacity-40"
            >
              Need test {asset.symbol}? Mint {asset.faucetAmount} from the faucet →
            </button>
          )}

          <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Amount
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--app-border-strong)] px-4 py-3">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              disabled={!isLive}
              className="w-full bg-transparent text-2xl font-semibold text-[var(--glow)] outline-none placeholder:text-[var(--text-dimmer)] disabled:opacity-40"
            />
            <span className="text-sm font-semibold text-[var(--text-dim)]">{symbol}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-dimmer)]">Available: {available}</p>

          <div className="mt-6 space-y-2 rounded-xl bg-white/5 p-4 text-sm">
            <div className="flex justify-between text-[var(--text-dim)]">
              <span>Contract</span>
              <a
                href={`https://explorer.testnet.chain.robinhood.com/address/${POOL_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[var(--lilac)] hover:text-[var(--glow)]"
              >
                {POOL_ADDRESS.slice(0, 6)}…{POOL_ADDRESS.slice(-4)}
              </a>
            </div>
            <div className="flex justify-between text-[var(--text-dim)]">
              <span>You will hold privately</span>
              <span className="font-mono text-[var(--glow)]">
                {amount || "0.0"} {symbol}
              </span>
            </div>
          </div>

          <button
            disabled={!canSubmit || isPending || isConfirming}
            onClick={primaryAction}
            className="mt-6 w-full rounded-xl bg-[var(--ultra)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40"
          >
            {buttonLabel}
          </button>
          {needsApproval && (
            <p className="mt-2 text-center text-[11px] text-[var(--text-dimmer)]">
              ERC-20s need one-time approval before the pool can pull funds.
            </p>
          )}

          {error && (
            <p className="mt-3 text-xs text-rose-400">
              {error.message.split("\n")[0]}
            </p>
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
          <ShieldPreviewCard />

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">How shielding works</p>
            <ol className="mt-3 space-y-3 text-sm text-[var(--text-dim)]">
              <li className="flex gap-3">
                <Pill tone="muted">1</Pill>
                <span>Connect the wallet you already use on Robinhood Chain.</span>
              </li>
              <li className="flex gap-3">
                <Pill tone="muted">2</Pill>
                <span>
                  ERC-20s (NVDA, TSLA, AAPL, USDG) need a quick 1-click approval first; ETH deposits directly.
                </span>
              </li>
              <li className="flex gap-3">
                <Pill tone="muted">3</Pill>
                <span>
                  Your assets enter the pool and can be traded privately across periodic Trade Waves.
                </span>
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
