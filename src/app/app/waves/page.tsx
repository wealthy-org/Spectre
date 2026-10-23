"use client";

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { WAVES } from "@/lib/mock-portfolio";
import { tradeWaveManagerAbi } from "@/lib/abi/TradeWaveManager";
import { TRADE_WAVE_MANAGER_ADDRESS } from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";

const CHAIN_ID = robinhoodChainTestnet.id;
const WAVE_MANAGER_ADDR = TRADE_WAVE_MANAGER_ADDRESS[CHAIN_ID];

export default function WavesPage() {
  const [selectedPair, setSelectedPair] = useState<"USDG_NVDA" | "USDG_ETH" | "USDG_TSLA">("USDG_NVDA");

  const { data: currentWaveIdData } = useReadContract({
    address: WAVE_MANAGER_ADDR,
    abi: tradeWaveManagerAbi,
    functionName: "currentWaveId",
    chainId: CHAIN_ID,
    query: { refetchInterval: 12000 },
  });
  const activeWaveNum = currentWaveIdData ? Number(currentWaveIdData) : 185;

  const NETTING_DATA = {
    USDG_NVDA: {
      pair: "USDG ⇄ NVDA",
      buyVolume: 86420,
      sellVolume: 58000,
      matched: 58000,
      imbalance: 28420,
      direction: "Buy NVDA on L2 Venue",
      crossPct: 67,
    },
    USDG_ETH: {
      pair: "USDG ⇄ ETH",
      buyVolume: 124000,
      sellVolume: 110000,
      matched: 110000,
      imbalance: 14000,
      direction: "Buy ETH on L2 Venue",
      crossPct: 88,
    },
    USDG_TSLA: {
      pair: "USDG ⇄ TSLA",
      buyVolume: 42000,
      sellVolume: 49000,
      matched: 42000,
      imbalance: 7000,
      direction: "Sell TSLA on L2 Venue",
      crossPct: 85,
    },
  }[selectedPair];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Waves Dashboard"
        lead="Trade and withdrawal waves settle on a deterministic schedule. Public metrics are strictly aggregate — individual portfolio composition and order ownership remain private."
      />

      {/* Live Windows Header */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between border-[var(--ultra)]/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                Active Trade Wave #{activeWaveNum}
              </p>
            </div>
            <p className="mt-1 text-3xl font-bold text-[var(--glow)]">
              <Countdown periodSeconds={120} />
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">Frequency: 2 min batch intervals</p>
          </div>
          <Link
            href="/app/trade"
            className="rounded-xl bg-[var(--ultra)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet)]"
          >
            Submit Trade →
          </Link>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <p className="text-xs font-semibold tracking-[0.1em] text-[rgba(235,221,255,.6)] uppercase">
                Next Withdrawal Wave #57
              </p>
            </div>
            <p className="mt-1 text-3xl font-bold text-[var(--glow)]">
              <Countdown periodSeconds={900} />
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">Frequency: 15 min batch intervals</p>
          </div>
          <Link
            href="/app/withdraw"
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[var(--glow)] transition-colors hover:border-[var(--ultra)]"
          >
            Withdraw →
          </Link>
        </Card>
      </div>

      {/* Protocol Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Total shielded value", "$4.2M"],
          ["Trade waves settled", "184"],
          ["Withdrawal waves settled", "56"],
          ["Aggregate volume (24h)", "$612K"],
        ].map(([label, value]) => (
          <Card key={label} className="text-center">
            <p className="text-2xl font-bold text-[var(--glow)]">{value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[rgba(235,221,255,.55)]">
              {label}
            </p>
          </Card>
        ))}
      </div>

      {/* Netting Engine Visualizer (Brief §25) */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--lilac)] uppercase">
                Trade Wave Netting Engine (Brief §25)
              </span>
              <Pill tone="accent">Simulated Live</Pill>
            </div>
            <p className="mt-1 text-base font-bold text-[var(--glow)]">
              Internal Crossing vs External Venue Imbalance
            </p>
          </div>

          <div className="flex gap-1.5">
            {[
              { id: "USDG_NVDA", label: "USDG ⇄ NVDA" },
              { id: "USDG_ETH", label: "USDG ⇄ ETH" },
              { id: "USDG_TSLA", label: "USDG ⇄ TSLA" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPair(p.id as typeof selectedPair)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedPair === p.id
                    ? "bg-[var(--ultra)] text-white"
                    : "bg-white/10 text-[var(--text-dim)] hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="text-[var(--text-dimmer)] uppercase">Total Buy Intents</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                ${NETTING_DATA.buyVolume.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="text-[var(--text-dimmer)] uppercase">Total Sell Intents</span>
              <p className="mt-1 text-xl font-bold text-indigo-400">
                ${NETTING_DATA.sellVolume.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="text-[var(--text-dimmer)] uppercase">Internal Match Rate</span>
              <p className="mt-1 text-xl font-bold text-[var(--lilac)]">
                {NETTING_DATA.crossPct}% Net Crossed
              </p>
            </div>
          </div>

          {/* Visual Netting Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-400 font-semibold">
                Internal Cross: ${NETTING_DATA.matched.toLocaleString()} (Zero External Slippage)
              </span>
              <span className="text-amber-400 font-semibold">
                Imbalance: ${NETTING_DATA.imbalance.toLocaleString()} ({NETTING_DATA.direction})
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
              <div
                style={{ width: `${NETTING_DATA.crossPct}%` }}
                className="bg-gradient-to-r from-emerald-500 to-[var(--ultra)]"
              />
              <div
                style={{ width: `${100 - NETTING_DATA.crossPct}%` }}
                className="bg-amber-500"
              />
            </div>
          </div>

          <p className="text-xs text-[var(--text-dim)] leading-relaxed">
            Instead of executing individual user transactions, Spectre crosses matched buy and sell volume inside the contract. The public blockchain only sees <strong>1 aggregate swap transaction</strong> for the remaining ${NETTING_DATA.imbalance.toLocaleString()} imbalance.
          </p>
        </div>
      </Card>

      {/* Settled Waves Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-[var(--glow)]">Settled Waves History</p>
            <p className="text-xs text-[var(--text-dim)]">Publicly verifiable execution roots</p>
          </div>
          <Link
            href="/proof"
            className="text-xs font-semibold text-[var(--lilac)] hover:text-white"
          >
            Audit All on /proof →
          </Link>
        </div>
        <ul className="divide-y divide-white/10 text-xs">
          {WAVES.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-4 p-4 sm:px-6 hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <Pill tone="muted">{w.kind}</Pill>
                <span className="font-mono font-bold text-[var(--glow)]">#{w.id}</span>
              </div>
              <span className="font-semibold text-[rgba(235,221,255,.8)]">
                {w.input} → {w.output}
              </span>
              <span className="hidden text-[var(--text-dimmer)] sm:inline">{w.time}</span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {w.status}
                </span>
                <Link
                  href="/proof"
                  className="text-[11px] text-[var(--lilac)] hover:underline"
                >
                  Proof ↗
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
