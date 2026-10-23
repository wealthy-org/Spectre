"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, Pill } from "@/components/app/ui";
import { SHIELDED_POOL_ADDRESS } from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";
import { IconAlert } from "@/components/app/Icons";

const POOL_ADDR = SHIELDED_POOL_ADDRESS[robinhoodChainTestnet.id];

const ACTORS = [
  {
    role: "Public Chain Observer",
    today: "Full visibility into balanceOf, all deposit/withdraw/transfer events, amounts, and sender/receiver addresses.",
    phase2: "Only sees deposit & withdrawal transactions at the pool boundary and pool-level totals. Cannot link internal ownership, trades, or recipients.",
    threatLevel: "High today / Minimal in Phase 2",
    badgeTone: "muted" as const,
  },
  {
    role: "Relayer (Future)",
    today: "Not yet active. Users submit transactions directly from their own connected wallet.",
    phase2: "Can see that an authorized action was requested and could choose to censor it, but cryptographically CANNOT forge a proof, divert withdrawals, or alter slippage limits.",
    threatLevel: "Censorship-only (Zero fund risk)",
    badgeTone: "accent" as const,
  },
  {
    role: "Prover (Client-side)",
    today: "Not yet active.",
    phase2: "Running locally in your browser (WASM/snarkjs). The private witness (secret keys and notes) never leaves your device.",
    threatLevel: "Zero witness exposure",
    badgeTone: "accent" as const,
  },
  {
    role: "Contract Operator / Owner",
    today: "Single deployer EOA. Can call pause() or setAssetSupported(). Cannot drain user balances; withdraw() is strictly owner-free and unpausable.",
    phase2: "Multisig + Timelock. Cannot forge balances, cannot withdraw user funds, cannot modify verification logic without delay.",
    threatLevel: "Restricted administrative surface",
    badgeTone: "muted" as const,
  },
  {
    role: "RPC Provider",
    today: "Sees IP address, requested block ranges, and raw transactions prior to inclusion.",
    phase2: "Still sees IP address and submitted calldata. ZK proofs protect state onchain, not transport-layer network metadata.",
    threatLevel: "Network metadata visible",
    badgeTone: "default" as const,
  },
  {
    role: "Frontend Interface",
    today: "Reads directly from RPC node event logs. No database, no tracking analytics, no user profiling.",
    phase2: "Maintains zero-knowledge client posture: all private accounts and keys are derived locally in browser memory.",
    threatLevel: "Zero backend tracking",
    badgeTone: "accent" as const,
  },
];

const SCENARIOS = [
  {
    event: "Spectre Frontend or hosting goes offline",
    impact: "Total UI outage",
    resolution: "Users can still interact directly with ShieldedPool via Foundry cast or Robinhood Explorer using their web3 wallet. No funds can ever be stranded because there is no custodial backend.",
  },
  {
    event: "Contract Admin key is compromised",
    impact: "Attacker could toggle pause() on deposits or change supported asset lists",
    resolution: "Attacker CANNOT drain shielded balances. withdraw() and transfer() only operate on msg.sender's own verified ledger balance, and withdraw() is explicitly non-pausable.",
  },
  {
    event: "RPC Provider endpoint fails or is blocked",
    impact: "UI fails to query balances or broadcast transactions",
    resolution: "Switch to any other Robinhood Chain Testnet RPC endpoint. All user state resides onchain and is completely independent of the node provider.",
  },
];

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState<"tiers" | "actors" | "failure">("tiers");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Privacy & Threat Model"
        lead="Honest architecture: exactly what is public today in Phase A, what becomes private with ZK in Phase 2, and what remains public by design."
      />

      {/* Live ZK Deployment Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-200">
                Phase 2 Live: ZK Groth16 Prover & Onchain Verifier Deployed
              </p>
              <p className="mt-1 text-xs text-emerald-200/80 leading-relaxed max-w-2xl">
                Zero-Knowledge circuit (<code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px] text-emerald-100">withdraw.circom</code>) and onchain Groth16 Verifier (
                <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px] text-emerald-100">
                  0x9D9C…F915
                </code>
                ) are actively live on Robinhood Chain Testnet. Client-side proof synthesis runs directly in-browser using WebAssembly.
              </p>
            </div>
          </div>
          <Link
            href="https://explorer.testnet.chain.robinhood.com/address/0x9D9C9Bff3fb5A2F3dc30D8013428Fe4376eaF915"
            target="_blank"
            className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 text-center"
          >
            Inspect ZK Verifier Onchain ↗
          </Link>
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: "tiers", label: "Data Tiers (Today vs Phase 2)" },
          { id: "actors", label: "Actor Disclosure Matrix" },
          { id: "failure", label: "Failure Modes & Escape Hatch" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--ultra)] text-white shadow-md shadow-[var(--ultra)]/20"
                : "text-[rgba(235,221,255,.65)] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Three Tier Cards */}
      {activeTab === "tiers" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Public Today */}
          <Card className="flex flex-col justify-between border-amber-500/25 bg-[#140F24]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                  Current State
                </span>
                <Pill tone="muted">Phase A</Pill>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-[var(--glow)]">
                  Public Today
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-dim)] leading-relaxed">
                  Everything required for transparent accounting verification:
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">balanceOf[asset][owner]</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Directly readable Solidity mapping for any wallet address.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Onchain Event Logs</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Deposited, Withdrawn, and Transferred logs expose sender, recipient, and amounts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Pool Aggregate Balances</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Total ETH and MockUSDG held by the vault.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200/90">
              No privacy claim is made today. Purely an accounting correctness prototype.
            </div>
          </Card>

          {/* Card 2: Target Architecture (Phase 2 ZK) */}
          <Card className="flex flex-col justify-between border-[var(--ultra)]/40 bg-[#18112C] shadow-xl shadow-[var(--ultra)]/5">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                  Active ZK Layer
                </span>
                <Pill tone="accent">Phase 2 Live</Pill>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-[var(--glow)]">
                  Live in Phase 2
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-dim)] leading-relaxed">
                  Enforces privacy with Groth16 ZK commitments, nullifiers, and client proving:
                </p>
              </div>


              <ul className="mt-5 space-y-2.5 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Private Account Ownership</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Deterministic derived keys control notes; real EOA is not linked.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Private Balances & Portfolio</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Hidden inside encrypted note commitments, not public mappings.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Trade Intents & Transfers</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Batched into Trade Waves; individual counterparty link is removed.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-[var(--ultra)]/30 bg-[var(--ultra)]/15 p-3 text-[11px] text-[var(--glow)]">
              Client-side Circom/Groth16 proving: the witness never leaves your browser.
            </div>
          </Card>

          {/* Card 3: Protocol Boundary (Permanently Public) */}
          <Card className="flex flex-col justify-between border-white/10 bg-[#140F24]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold tracking-wider text-[var(--text-dim)] uppercase">
                  Protocol Boundary
                </span>
                <Pill tone="default">By Design</Pill>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-[var(--glow)]">
                  Permanently Public
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-dim)] leading-relaxed">
                  Actions at the Robinhood Chain layer that can never be hidden:
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Deposits & Withdrawals</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Asset amount and exit destination when crossing the vault boundary.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Trade Wave Aggregates</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      Total netted volume and execution clearing price on L2.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <div>
                    <strong className="text-[var(--glow)]">Network Metadata</strong>
                    <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                      IP address and RPC timestamps (ZK does not alter transport layer).
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-[var(--text-dim)]">
              Privacy means reducing linkage, not fabricating mathematical miracles.
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Actor Disclosure Matrix */}
      {activeTab === "actors" && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-[var(--glow)]">Who Can See What?</h3>
            <p className="mt-1 text-xs text-[var(--text-dim)]">
              Explicit evaluation of information access for every participant in the Spectre ecosystem.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                <tr>
                  <th className="py-3 px-5 sm:px-6">Actor</th>
                  <th className="py-3 px-5 sm:px-6">What they see today (Phase A)</th>
                  <th className="py-3 px-5 sm:px-6">What they see in Phase 2 (ZK)</th>
                  <th className="py-3 px-5 sm:px-6">Worst Case Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {ACTORS.map((a) => (
                  <tr key={a.role} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 sm:px-6 font-semibold text-[var(--glow)] text-xs">
                      {a.role}
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-xs text-[var(--text-dim)] leading-relaxed">
                      {a.today}
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-xs text-[rgba(235,221,255,.85)] leading-relaxed">
                      {a.phase2}
                    </td>
                    <td className="py-4 px-5 sm:px-6">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-[var(--lilac)]">
                        {a.threatLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Failure Modes */}
      {activeTab === "failure" && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-[var(--glow)]">The Self-Custody Escape Hatch</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-dim)]">
              Spectre is engineered so that operator or infrastructure failure can never result in lost or permanently trapped funds. The smart contract acts as an autonomous vault that requires zero backend permission to withdraw.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-[10px] font-bold text-[var(--ultra)] uppercase tracking-wider">
                  Invariant 1
                </span>
                <p className="mt-1.5 text-sm font-bold text-[var(--glow)]">No Admin Withdrawal</p>
                <p className="mt-1 text-xs text-[var(--text-dim)] leading-relaxed">
                  The contract owner has no function to withdraw, seize, or divert any user balance.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-[10px] font-bold text-[var(--ultra)] uppercase tracking-wider">
                  Invariant 2
                </span>
                <p className="mt-1.5 text-sm font-bold text-[var(--glow)]">Unpausable Exits</p>
                <p className="mt-1 text-xs text-[var(--text-dim)] leading-relaxed">
                  Even during an emergency pause triggered by the owner, <code>withdraw()</code> remains 100% active.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-[10px] font-bold text-[var(--ultra)] uppercase tracking-wider">
                  Invariant 3
                </span>
                <p className="mt-1.5 text-sm font-bold text-[var(--glow)]">Amount Conservation</p>
                <p className="mt-1 text-xs text-[var(--text-dim)] leading-relaxed">
                  Contract asset holdings strictly equal or exceed total user claims at all times.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/10">
              <h3 className="text-base font-bold text-[var(--glow)]">Scenario Stress Tests</h3>
            </div>
            <div className="divide-y divide-white/10">
              {SCENARIOS.map((s) => (
                <div key={s.event} className="p-5 sm:p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--ultra)]" />
                    <p className="text-xs font-bold text-[var(--glow)]">{s.event}</p>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
                      {s.impact}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(235,221,255,.78)] leading-relaxed pl-5">
                    {s.resolution}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Link
          href="/proof"
          className="text-xs font-semibold text-[var(--lilac)] hover:text-white transition-colors"
        >
          ← Explore Public Settlement Proofs
        </Link>
        <Link
          href="/app"
          className="rounded-xl bg-[var(--ultra)] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet)]"
        >
          Open App Dashboard →
        </Link>
      </div>
    </div>
  );
}
