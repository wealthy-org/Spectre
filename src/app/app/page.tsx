"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatUnits, getAddress } from "viem";
import { useAccount, usePublicClient, useReadContract } from "wagmi";

import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { HOLDINGS, TOTAL, ACTIVITY } from "@/lib/mock-portfolio";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import {
  SHIELDED_POOL_ADDRESS,
  MOCK_USDG_ADDRESS,
  MOCK_STOCK_TOKENS,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { usePrivateAccount } from "@/lib/private-account";
import { IconKey } from "@/components/app/Icons";
import { TokenIcon } from "@/components/app/TokenIcon";

const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[robinhoodChainTestnet.id];

export default function PortfolioPage() {
  const { address, isConnected, chainId } = useAccount();
  const onCorrectChain = chainId === robinhoodChainTestnet.id;

  const { data: shieldedEth } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [NATIVE_ASSET, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: robinhoodChainTestnet.id,
    query: { enabled: isConnected && onCorrectChain, refetchInterval: 8000 },
  });

  const { data: shieldedUsdg } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [MOCK_USDG_ADDRESS[robinhoodChainTestnet.id], address ?? "0x0000000000000000000000000000000000000000"],
    chainId: robinhoodChainTestnet.id,
    query: { enabled: isConnected && onCorrectChain, refetchInterval: 8000 },
  });

  const { data: shieldedNvda } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [MOCK_STOCK_TOKENS.NVDA, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: robinhoodChainTestnet.id,
    query: { enabled: isConnected && onCorrectChain, refetchInterval: 8000 },
  });

  const { data: shieldedTsla } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [MOCK_STOCK_TOKENS.TSLA, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: robinhoodChainTestnet.id,
    query: { enabled: isConnected && onCorrectChain, refetchInterval: 8000 },
  });

  const { data: shieldedAapl } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [MOCK_STOCK_TOKENS.AAPL, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: robinhoodChainTestnet.id,
    query: { enabled: isConnected && onCorrectChain, refetchInterval: 8000 },
  });

  const { isUnlocked, keys, unlock, isDeriving } = usePrivateAccount();
  const publicClient = usePublicClient({ chainId: robinhoodChainTestnet.id });

  // Real recent activity state
  const [realActivity, setRealActivity] = useState<
    { id: string; kind: string; detail: string; time: string; status: string }[] | null
  >(null);

  useEffect(() => {
    if (!address || !isConnected || !onCorrectChain || !publicClient) {
      setRealActivity(null);
      return;
    }

    let isSubscribed = true;
    (async () => {
      try {
        let checksumAddress: `0x${string}`;
        try {
          checksumAddress = getAddress(address);
        } catch {
          checksumAddress = address as `0x${string}`;
        }

        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 40000n ? latestBlock - 40000n : 0n;

        const [depLogs, withLogs] = await Promise.all([
          publicClient
            .getContractEvents({
              address: POOL_ADDRESS,
              abi: shieldedPoolAbi,
              eventName: "Deposited",
              args: { owner: checksumAddress },
              fromBlock,
              toBlock: latestBlock,
            })
            .catch(() => []),
          publicClient
            .getContractEvents({
              address: POOL_ADDRESS,
              abi: shieldedPoolAbi,
              eventName: "Withdrawn",
              args: { owner: checksumAddress },
              fromBlock,
              toBlock: latestBlock,
            })
            .catch(() => []),
        ]);

        if (!isSubscribed) return;

        const events = [
          ...depLogs.map((l) => ({
            id: `${l.transactionHash}-${l.logIndex}`,
            kind: "Shield",
            detail: `Deposited ${Number(formatUnits((l.args as { amount?: bigint }).amount ?? 0n, 18)).toFixed(2)} tokens`,
            time: "Recent",
            status: "Confirmed",
            blockNumber: l.blockNumber,
          })),
          ...withLogs.map((l) => ({
            id: `${l.transactionHash}-${l.logIndex}`,
            kind: "Withdraw",
            detail: `Withdrew ${Number(formatUnits((l.args as { amount?: bigint }).amount ?? 0n, 18)).toFixed(2)} tokens`,
            time: "Recent",
            status: "Confirmed",
            blockNumber: l.blockNumber,
          })),
        ];

        events.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));
        setRealActivity(events.slice(0, 3));
      } catch (err) {
        console.warn("Failed to fetch portfolio recent activity:", err);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [address, isConnected, onCorrectChain, publicClient]);


  // Price definitions (USD)
  const PRICES = {
    ETH: 3250.0,
    USDG: 1.0,
    NVDA: 139.38,
    TSLA: 243.24,
    AAPL: 181.5,
  };

  // Convert raw bigint balances to human floats
  const numEth = shieldedEth ? Number(formatUnits(shieldedEth, 18)) : 0;
  const numUsdg = shieldedUsdg ? Number(formatUnits(shieldedUsdg, 18)) : 0;
  const numNvda = shieldedNvda ? Number(formatUnits(shieldedNvda, 18)) : 0;
  const numTsla = shieldedTsla ? Number(formatUnits(shieldedTsla, 18)) : 0;
  const numAapl = shieldedAapl ? Number(formatUnits(shieldedAapl, 18)) : 0;

  // Real value calculations
  const valEth = numEth * PRICES.ETH;
  const valUsdg = numUsdg * PRICES.USDG;
  const valNvda = numNvda * PRICES.NVDA;
  const valTsla = numTsla * PRICES.TSLA;
  const valAapl = numAapl * PRICES.AAPL;

  const realTotal = valEth + valUsdg + valNvda + valTsla + valAapl;

  // Display holdings: if connected and has any balance, show real onchain values; otherwise show baseline preview
  const displayTotal = isConnected && onCorrectChain ? realTotal : TOTAL;

  const realHoldings = [
    { ticker: "USDG", name: "USD Global", amount: numUsdg, value: valUsdg, color: "#9C48F0" },
    { ticker: "NVDA", name: "NVIDIA Stock Token", amount: numNvda, value: valNvda, color: "#4FD1C5" },
    { ticker: "TSLA", name: "Tesla Stock Token", amount: numTsla, value: valTsla, color: "#F0A848" },
    { ticker: "AAPL", name: "Apple Stock Token", amount: numAapl, value: valAapl, color: "#F0609C" },
    { ticker: "ETH", name: "Ethereum", amount: numEth, value: valEth, color: "#C9A2FF" },
  ].map((h) => ({
    ...h,
    pct: realTotal > 0 ? (h.value / realTotal) * 100 : 20,
  }));

  const displayHoldings = isConnected && onCorrectChain ? realHoldings : HOLDINGS.map((h) => ({ ...h, amount: undefined }));


  return (
    <div>
      <PageHeader
        title="Private Portfolio"
        lead="Your onchain wallet shows a shield deposit — not what you actually hold."
      />

      {isConnected && onCorrectChain && (
        <div className="mb-6 rounded-2xl border border-[var(--ultra)]/30 bg-[var(--surface-2)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ultra)]/20 text-[var(--lilac)]">
                <IconKey className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[var(--glow)]">
                    {isUnlocked ? "Private Account Session Active" : "Private Account Locked"}
                  </p>
                  <Pill tone={isUnlocked ? "accent" : "muted"}>
                    {isUnlocked ? "Derived" : "Needs Signature"}
                  </Pill>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {isUnlocked && keys
                    ? `Shielded ID: ${keys.privateAddress}`
                    : "Derive your client-side private account key to view shielded portfolio notes."}
                </p>
              </div>
            </div>
            {!isUnlocked && (
              <button
                onClick={() => unlock()}
                disabled={isDeriving}
                className="shrink-0 rounded-xl bg-[var(--ultra)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-50"
              >
                {isDeriving ? "Deriving…" : "Derive Shield Key"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
              Total balance
            </span>
            <Pill tone="accent">
              {isConnected && onCorrectChain ? "Onchain Shielded" : "Preview"}
            </Pill>
          </div>
          <p className="mt-1 text-4xl font-bold tracking-tight text-[var(--glow)] sm:text-5xl font-mono">
            ${displayTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10 gap-0.5">
            {displayHoldings.map((h) => (
              <div
                key={h.ticker}
                style={{
                  width: `${Math.max(h.pct, realTotal > 0 ? 0 : 20)}%`,
                  background: h.color,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          <ul className="mt-5 divide-y divide-white/10">
            {displayHoldings.map((h) => (
              <li key={h.ticker} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={h.ticker} size={32} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--glow)]">{h.ticker}</p>
                    <p className="text-xs text-[rgba(235,221,255,.55)]">
                      {h.amount !== undefined ? `${h.amount.toFixed(h.ticker === "ETH" ? 4 : 2)} ${h.ticker}` : h.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-semibold text-[var(--glow)]">
                    ${h.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {realTotal > 0 && (
                    <p className="text-[10px] text-[var(--text-dim)] font-mono">
                      {h.pct.toFixed(1)}%
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>


          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Shield", href: "/app/shield" },
              { label: "Trade", href: "/app/trade" },
              { label: "Send", href: "/app/send" },
              { label: "Withdraw", href: "/app/withdraw" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="rounded-xl border border-white/10 py-2.5 text-center text-sm font-semibold text-[rgba(235,221,255,.85)] transition-colors hover:border-[var(--ultra)] hover:text-white"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
                Onchain shielded balance
              </span>
              <Pill tone="muted">Testnet · live</Pill>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-3xl font-bold text-[var(--glow)]">
                {isConnected && onCorrectChain && shieldedEth !== undefined
                  ? `${Number(formatUnits(shieldedEth, 18)).toFixed(4)} ETH`
                  : "— ETH"}
              </p>
              {isConnected && onCorrectChain && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--lilac)] font-mono border-t border-white/5 pt-2">
                  <span>
                    USDG: {shieldedUsdg !== undefined ? Number(formatUnits(shieldedUsdg, 18)).toFixed(2) : "0.00"}
                  </span>
                  <span>
                    NVDA: {shieldedNvda !== undefined ? Number(formatUnits(shieldedNvda, 18)).toFixed(2) : "0.00"}
                  </span>
                  <span>
                    TSLA: {shieldedTsla !== undefined ? Number(formatUnits(shieldedTsla, 18)).toFixed(2) : "0.00"}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--text-dimmer)]">
              {isConnected
                ? onCorrectChain
                  ? "Read directly from ShieldedPool.balanceOf on Robinhood Chain Testnet."
                  : "Switch to Robinhood Chain Testnet to see this."
                : "Connect your wallet to see your real deposited balance."}
            </p>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                Next trade wave
              </p>
              <p className="mt-1 text-3xl font-bold text-[var(--glow)]">
                <Countdown periodSeconds={225} />
              </p>
            </div>
            <Link
              href="/app/trade"
              className="rounded-xl bg-[var(--ultra)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)]"
            >
              Trade
            </Link>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                Next withdrawal wave
              </p>
              <p className="mt-1 text-3xl font-bold text-[var(--glow)]">
                <Countdown periodSeconds={900} />
              </p>
            </div>
            <Link
              href="/app/withdraw"
              className="rounded-xl px-5 py-3 text-sm font-semibold text-[var(--ultra)] ring-1 ring-[var(--ultra)] transition-colors hover:bg-[var(--ultra)] hover:text-white"
            >
              Withdraw
            </Link>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">What stays public</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(235,221,255,.68)]">
              Deposits and withdrawals are onchain actions — amount, asset, and time are
              visible at the pool boundary. Spectre reduces the link between them; it
              does not claim invisibility.
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-0">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <p className="text-sm font-semibold text-[var(--glow)]">Recent activity</p>
          <Link
            href="/app/activity"
            className="text-xs font-semibold text-[var(--lilac)] hover:text-[var(--glow)]"
          >
            View all →
          </Link>
        </div>
        {/* Activity list or empty state */}
        {realActivity && realActivity.length > 0 ? (
          <ul className="mt-3 divide-y divide-[var(--app-border)]">
            {realActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <Pill tone="accent">{a.kind}</Pill>
                  <span className="text-sm font-mono text-[var(--glow)]">{a.detail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-[var(--text-dimmer)] sm:inline">
                    {a.time}
                  </span>
                  <Pill tone="default">{a.status}</Pill>
                </div>
              </li>
            ))}
          </ul>
        ) : isConnected && onCorrectChain && realActivity !== null ? (
          <div className="p-8 text-center text-xs text-[var(--text-dim)]">
            No shielded activity found for this wallet yet. Deposits and wave trades will appear here.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--app-border)]">
            {ACTIVITY.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <Pill tone="muted">{a.kind}</Pill>
                  <span className="text-sm text-[var(--glow)]">{a.detail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-[var(--text-dimmer)] sm:inline">
                    {a.time}
                  </span>
                  <Pill tone="default">{a.status}</Pill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

    </div>
  );
}
