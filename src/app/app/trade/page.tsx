"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Countdown, Pill } from "@/components/app/ui";
import { useAccount } from "wagmi";
import { usePrivateAccount } from "@/lib/private-account";

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
}

const REFERENCE_PRICES: Record<string, number> = {
  USDG: 1,
  NVDA: 139.38,
  TSLA: 243.24,
  AAPL: 181.50,
  ETH: 3250.00,
};

export default function TradePage() {
  const { isConnected } = useAccount();
  const { isUnlocked, unlock, isDeriving } = usePrivateAccount();

  const [payAsset, setPayAsset] = useState("USDG");
  const [receiveAsset, setReceiveAsset] = useState("NVDA");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [activeIntents, setActiveIntents] = useState<ActiveIntent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const payPrice = REFERENCE_PRICES[payAsset] || 1;
  const recPrice = REFERENCE_PRICES[receiveAsset] || 1;

  // Estimated output
  const estOutput = numAmount > 0 ? (numAmount * payPrice) / recPrice : 0;
  const slippageFraction = (parseFloat(slippage) || 0.5) / 100;
  const minOutput = estOutput * (1 - slippageFraction);

  async function handleSubmitTrade() {
    if (!amount || numAmount <= 0) return;

    if (!isUnlocked) {
      await unlock();
    }

    setIsSubmitting(true);
    setSuccessMsg(null);

    // Simulate committing the intent to the active wave
    setTimeout(() => {
      const newIntent: ActiveIntent = {
        id: `INT-${Date.now().toString().slice(-4)}`,
        waveId: 185,
        paySymbol: payAsset,
        payAmount: amount,
        receiveSymbol: receiveAsset,
        estReceive: estOutput.toFixed(4),
        minReceive: minOutput.toFixed(4),
        slippage: `${slippage}%`,
        status: "Committed",
        timestamp: "Just now",
      };

      setActiveIntents((prev) => [newIntent, ...prev]);
      setIsSubmitting(false);
      setAmount("");
      setSuccessMsg(`Intent #${newIntent.id} committed to Trade Wave #185!`);

      // Advance intent through wave stages
      setTimeout(() => {
        setActiveIntents((prev) =>
          prev.map((i) => (i.id === newIntent.id ? { ...i, status: "Netting" } : i))
        );
      }, 7000);

      setTimeout(() => {
        setActiveIntents((prev) =>
          prev.map((i) => (i.id === newIntent.id ? { ...i, status: "Settled" } : i))
        );
      }, 15000);
    }, 1200);
  }

  return (
    <div>
      <PageHeader
        title="Private trade"
        lead="Submit a private trade intent for the next Trade Wave. Intents accumulate into scheduled windows, net internally, and settle together rather than executing one by one."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
                    setReceiveAsset(val === "USDG" ? "NVDA" : "USDG");
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

            <div className="mt-2 flex items-baseline justify-between">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full bg-transparent text-3xl font-semibold text-[var(--glow)] outline-none placeholder:text-[rgba(235,221,255,.3)]"
              />
              <div className="flex gap-1.5">
                {["100", "500", "1000"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="rounded bg-white/10 px-2 py-0.5 text-xs text-[var(--text-dim)] hover:text-white"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const prevPay = payAsset;
                  setPayAsset(receiveAsset);
                  setReceiveAsset(prevPay);
                }}
                className="rounded-full border border-white/15 p-2 text-[rgba(235,221,255,.6)] transition-colors hover:border-[var(--ultra)] hover:text-white"
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
                      className={`rounded px-2 py-1 font-semibold transition-colors ${
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
                <span className="text-[var(--glow)] font-semibold">Robinhood Chain Trade Wave</span>
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
                <span className="text-[var(--glow)]">0.15% (No fee stacking)</span>
              </div>
            </div>

            {successMsg && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {successMsg}
              </div>
            )}

            <button
              onClick={handleSubmitTrade}
              disabled={!amount || numAmount <= 0 || isSubmitting || isDeriving}
              className="mt-6 w-full rounded-xl bg-[var(--ultra)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40"
            >
              {isSubmitting
                ? "Submitting Intent to Wave…"
                : !isConnected
                ? "Connect Wallet to Trade"
                : !isUnlocked
                ? "Derive Shield Key & Submit Intent"
                : "Submit Private Trade Intent"}
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
                            ? "bg-indigo-500/20 text-indigo-300 animate-pulse"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {intent.status}
                      </span>
                      {intent.status === "Settled" && (
                        <Link
                          href="/proof"
                          className="text-[10px] text-[var(--lilac)] underline hover:text-white"
                        >
                          View Settlement Proof ↗
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Wave Status & Explanation */}
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lilac)]">
                  Active Execution Window
                </span>
                <p className="text-lg font-bold text-[var(--glow)]">Trade Wave #185</p>
              </div>
              <Pill tone="accent">Collecting Intents</Pill>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="text-xs uppercase tracking-wide text-[var(--text-dimmer)]">
                Window Closes In
              </span>
              <p className="mt-1 font-mono text-3xl font-bold text-[var(--glow)]">
                <Countdown periodSeconds={120} />
              </p>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Intents Queued</span>
                <span className="font-semibold text-[var(--glow)]">14 orders</span>
              </div>
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Current Batch Volume</span>
                <span className="font-semibold text-[var(--glow)]">$86,420 USDG</span>
              </div>
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Internal Match Estimate</span>
                <span className="font-semibold text-emerald-400">~68% crossed internally</span>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">
              How Trade Waves Protect You
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[rgba(235,221,255,.75)]">
              In normal DEX swaps, your wallet address, traded token, and exact amount are exposed in real time to MEV sandwich bots.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[rgba(235,221,255,.75)]">
              In Spectre, private trade intents accumulate into a wave. When it closes, buy and sell orders are crossed internally. Only the net imbalance touches an external venue as one single transaction.
            </p>
            <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-[var(--text-dim)]">
              <Link href="/privacy" className="text-[var(--lilac)] hover:underline">
                Read the Privacy Threat Model →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
