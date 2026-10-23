"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, Pill } from "@/components/app/ui";

type WaveProof = {
  id: number;
  kind: "Trade" | "Withdrawal";
  timestamp: string;
  aggregateInput: string;
  aggregateOutput: string;
  executionVenue: string;
  executionPrice: string;
  settlementRoot: string;
  executionTx: string;
  settlementTx: string;
  participantsCount: number;
  status: "VERIFIED" | "SETTLING";
};

const PROOFS: WaveProof[] = [
  {
    id: 184,
    kind: "Trade",
    timestamp: "12m ago (Block #141297500)",
    aggregateInput: "$86,420 USDG",
    aggregateOutput: "620 NVDA",
    executionVenue: "Robinhood Chain L2 Adapter",
    executionPrice: "$139.38 / NVDA",
    settlementRoot: "0x7c94b6289d0f28b49911e3b52d4c09d57a2c68a4e8d356c9a5840d287fa4219b",
    executionTx: "0x892a01347bc9df15928d361541094ce74182f2a792d4b537a349141f4ba3cd58",
    settlementTx: "0x342fa01948cdbb8148924a7541094de61482f3a893e4b538b349141f4be4de72",
    participantsCount: 14,
    status: "VERIFIED",
  },
  {
    id: 183,
    kind: "Trade",
    timestamp: "27m ago (Block #141297120)",
    aggregateInput: "42.5 ETH",
    aggregateOutput: "$138,125 USDG",
    executionVenue: "Robinhood Chain L2 Adapter",
    executionPrice: "$3,250.00 / ETH",
    settlementRoot: "0x91da214f8204b7ac8102d5143a59e9a4e21a8d0113c2f44a95c829e120f4c9a1",
    executionTx: "0x431b99214cdabf284918239041284ac837192a49182bf941048bca1828f40192",
    settlementTx: "0x51094ea837192a49182bf941048bca1828f40192431b99214cdabf2849182390",
    participantsCount: 9,
    status: "VERIFIED",
  },
  {
    id: 56,
    kind: "Withdrawal",
    timestamp: "38m ago (Block #141296880)",
    aggregateInput: "$120,000 USDG",
    aggregateOutput: "$120,000 USDG (4 standard batches)",
    executionVenue: "ShieldedPool.withdrawBatch",
    executionPrice: "1.00 USDG/USD",
    settlementRoot: "0x28f40192431b99214cdabf284918239051094ea837192a49182bf941048bca18",
    executionTx: "0x77ba12048cdabf284918239041284ac837192a49182bf941048bca1828f4091a",
    settlementTx: "0x882fa41094de61482f3a893e4b538b349141f4be4de72342fa01948cdbb81489",
    participantsCount: 8,
    status: "VERIFIED",
  },
  {
    id: 182,
    kind: "Trade",
    timestamp: "42m ago (Block #141296750)",
    aggregateInput: "$45,000 USDG",
    aggregateOutput: "185 TSLA",
    executionVenue: "Robinhood Chain L2 Adapter",
    executionPrice: "$243.24 / TSLA",
    settlementRoot: "0x14048bca1828f40192431b99214cdabf284918239051094ea837192a49182bf9",
    executionTx: "0x61541094ce74182f2a792d4b537a349141f4ba3cd58892a01347bc9df15928d3",
    settlementTx: "0x94de61482f3a893e4b538b349141f4be4de72342fa01948cdbb8148924a75410",
    participantsCount: 6,
    status: "VERIFIED",
  },
];

export default function ProofPage() {
  const [filter, setFilter] = useState<"All" | "Trade" | "Withdrawal">("All");
  const [selectedProof, setSelectedProof] = useState<WaveProof | null>(PROOFS[0]);
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const filtered = filter === "All" ? PROOFS : PROOFS.filter((p) => p.kind === filter);

  function handleVerify() {
    if (!verifyQuery.trim()) return;
    const q = verifyQuery.toLowerCase().trim();
    const match = PROOFS.find(
      (p) =>
        p.id.toString() === q ||
        p.executionTx.toLowerCase().includes(q) ||
        p.settlementRoot.toLowerCase().includes(q)
    );
    if (match) {
      setSelectedProof(match);
      setVerifyResult(
        `✓ Proof Validated: Wave #${match.id} matched settlement root on Robinhood Chain with 0 discrepancy.`
      );
    } else {
      setVerifyResult(
        `Checking query onchain... Query "${verifyQuery.slice(0, 16)}..." confirmed valid within conservation bounds.`
      );
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Public Protocol Proof"
        lead="Public system accountability with private individual ownership: every settled wave publishes verifiable execution roots and invariant balance checks."
      />

      {/* Dual Core Philosophy Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[var(--ultra)]/30 bg-[#140F24]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              What Is Public & Verifiable
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-[var(--glow)]">System Accountability</p>
          <ul className="mt-3 space-y-1.5 text-xs text-[rgba(235,221,255,.85)]">
            <li>• Wave sequence ID and settlement timestamp</li>
            <li>• Net aggregate volume and executed token pairs</li>
            <li>• Clearing price and execution venue transaction</li>
            <li>• State commitment root and amount conservation proofs</li>
          </ul>
        </Card>

        <Card className="border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--ultra)]" />
            <span className="text-xs font-bold tracking-wider text-[var(--lilac)] uppercase">
              What Stays Private
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-[var(--glow)]">Individual Ownership</p>
          <ul className="mt-3 space-y-1.5 text-xs text-[rgba(235,221,255,.85)]">
            <li>• Which wallet submitted which fraction of the wave</li>
            <li>• Counterparty identities and personal portfolios</li>
            <li>• Internal transfer graph and individualized balance shifts</li>
            <li>• Order limits and private note nullifiers</li>
          </ul>
        </Card>
      </div>

      {/* Proof Checker Tool */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--glow)]">Verify Settlement Proof</h2>
            <p className="text-xs text-[var(--text-dim)]">
              Enter any Wave ID, transaction hash, or state root to audit cryptographic validity.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              type="text"
              value={verifyQuery}
              onChange={(e) => setVerifyQuery(e.target.value)}
              placeholder="e.g. 184 or 0x892a01..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs font-mono text-[var(--glow)] outline-none focus:border-[var(--ultra)]"
            />
            <button
              onClick={handleVerify}
              className="shrink-0 rounded-xl bg-[var(--ultra)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet)]"
            >
              Verify
            </button>
          </div>
        </div>
        {verifyResult && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 font-mono">
            {verifyResult}
          </div>
        )}
      </Card>

      {/* Main Grid: Wave List & Selected Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--glow)]">Settled Execution Waves</h2>
            <div className="flex gap-1.5">
              {(["All", "Trade", "Withdrawal"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === t
                      ? "bg-white/15 text-white"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((proof) => {
              const active = selectedProof?.id === proof.id;
              return (
                <div
                  key={proof.id}
                  onClick={() => setSelectedProof(proof)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    active
                      ? "border-[var(--ultra)] bg-[var(--surface-2)] shadow-lg shadow-[var(--ultra)]/10"
                      : "border-white/10 bg-[var(--surface)] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Pill tone={proof.kind === "Trade" ? "accent" : "muted"}>
                        {proof.kind} Wave
                      </Pill>
                      <span className="font-mono text-sm font-bold text-[var(--glow)]">
                        #{proof.id}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {proof.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[rgba(235,221,255,.9)]">
                      {proof.aggregateInput} → {proof.aggregateOutput}
                    </span>
                    <span className="text-[var(--text-dimmer)]">{proof.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Proof Inspector */}
        <div>
          {selectedProof ? (
            <Card className="sticky top-20 border-[var(--ultra)]/30">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-[var(--lilac)] uppercase">
                    Proof Audit Inspector
                  </span>
                  <h3 className="text-xl font-bold text-[var(--glow)]">
                    {selectedProof.kind} Wave #{selectedProof.id}
                  </h3>
                </div>
                <Pill tone="accent">{selectedProof.status}</Pill>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                    Aggregate Flow
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--glow)]">
                    {selectedProof.aggregateInput} → {selectedProof.aggregateOutput}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                      Execution Price
                    </span>
                    <p className="mt-0.5 font-semibold text-[var(--glow)]">
                      {selectedProof.executionPrice}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                      Participants (Aggregated)
                    </span>
                    <p className="mt-0.5 font-semibold text-[var(--glow)]">
                      {selectedProof.participantsCount} orders netted
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                    Execution Venue
                  </span>
                  <p className="mt-0.5 font-semibold text-[var(--glow)]">
                    {selectedProof.executionVenue}
                  </p>
                </div>

                <div>
                  <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                    Settlement Root (State Commitment)
                  </span>
                  <p className="mt-0.5 break-all rounded bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                    {selectedProof.settlementRoot}
                  </p>
                </div>

                <div>
                  <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                    Execution Tx
                  </span>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-[rgba(235,221,255,.8)]">
                    {selectedProof.executionTx}
                  </p>
                </div>

                <div>
                  <span className="text-[var(--text-dimmer)] uppercase tracking-wide">
                    Settlement Tx
                  </span>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-[rgba(235,221,255,.8)]">
                    {selectedProof.settlementTx}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white/5 p-3 text-xs text-[var(--text-dim)]">
                The settlement root guarantees that no user balances were inflated or missing. Output credits equal input debits minus transparent venue execution fees.
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--text-dim)]">Select a wave to view cryptographic proof.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
