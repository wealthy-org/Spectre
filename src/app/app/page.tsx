"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { HOLDINGS, TOTAL, ACTIVITY } from "@/lib/mock-portfolio";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import { SHIELDED_POOL_ADDRESS, NATIVE_ASSET } from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { usePrivateAccount } from "@/lib/private-account";
import { IconKey } from "@/components/app/Icons";

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

  const { isUnlocked, keys, unlock, isDeriving } = usePrivateAccount();

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
            <Pill tone="accent">Shielded</Pill>
          </div>
          <p className="mt-1 text-4xl font-bold tracking-tight text-[var(--glow)] sm:text-5xl">
            ${TOTAL.toLocaleString("en-US")}
          </p>

          <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            {HOLDINGS.map((h) => (
              <div key={h.ticker} style={{ width: `${h.pct}%`, background: h.color }} />
            ))}
          </div>

          <ul className="mt-5 divide-y divide-white/10">
            {HOLDINGS.map((h) => (
              <li key={h.ticker} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: h.color }}
                  >
                    {h.ticker[0]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--glow)]">{h.ticker}</p>
                    <p className="text-xs text-[rgba(235,221,255,.55)]">{h.name}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[var(--glow)]">
                  ${h.value.toLocaleString("en-US")}
                </span>
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
            <p className="mt-2 text-3xl font-bold text-[var(--glow)]">
              {isConnected && onCorrectChain && shieldedEth !== undefined
                ? `${formatUnits(shieldedEth, 18)} ETH`
                : "— ETH"}
            </p>
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
        <ul className="mt-3 divide-y divide-[var(--app-border)]">
          {ACTIVITY.slice(0, 3).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
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
      </Card>
    </div>
  );
}
