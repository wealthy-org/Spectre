"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, Pill } from "@/components/app/ui";
import { SHIELDED_POOL_ADDRESS } from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";

const POOL_ADDR = SHIELDED_POOL_ADDRESS[robinhoodChainTestnet.id];

const ACTORS = [
  {
    role: "Public Chain Observer",
    today: "Full visibility into balanceOf, all deposit/withdraw/transfer events, amounts, and sender/receiver addresses.",
    phase2: "Only sees deposit & withdrawal transactions at the pool boundary and pool-level totals. Cannot link internal ownership, trades, or recipients.",
    threatLevel: "High today / Minimal in Phase 2",
  },
  {
    role: "Relayer (Future)",
    today: "Not yet active. Users submit transactions directly from their own connected wallet.",
    phase2: "Can see that an authorized action was requested and could choose to censor it, but cryptographically CANNOT forge a proof, divert withdrawals, or alter slippage limits.",
    threatLevel: "Censorship-only (Zero fund risk)",
  },
  {
    role: "Prover (Client-side)",
    today: "Not yet active.",
    phase2: "Running locally in your browser (WASM/snarkjs). The private witness (secret keys and notes) never leaves your device.",
    threatLevel: "Zero witness exposure",
  },
  {
    role: "Contract Operator / Owner",
    today: "Single deployer EOA. Can call pause() or setAssetSupported(). Cannot drain user balances; withdraw() is strictly owner-free and unpausable.",
    phase2: "Multisig + Timelock. Cannot forge balances, cannot withdraw user funds, cannot modify verification logic without delay.",
    threatLevel: "Restricted administrative surface",
  },
  {
    role: "RPC Provider",
    today: "Sees IP address, requested block ranges, and raw transactions prior to inclusion.",
    phase2: "Still sees IP address and submitted calldata. ZK proofs protect state onchain, not transport-layer network metadata.",
    threatLevel: "Network metadata visible",
  },
  {
    role: "Frontend Interface",
    today: "Reads directly from RPC node event logs. No database, no tracking analytics, no user profiling.",
    phase2: "Maintains zero-knowledge client posture: all private accounts and keys are derived locally in browser memory.",
    threatLevel: "Zero backend tracking",
  },
];

const SCENARIOS = [
  {
    event: "Spectre Frontend or Vercel hosting goes offline",
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

      {/* Honest Warning Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
              !
            </span>
            <div>
              <p className="text-base font-semibold text-amber-200">
                Phase A Status: Transparent Prototype (Zero Privacy Guarantee Today)
              </p>
              <p className="mt-1 text-sm text-amber-200/80">
                Current balances on Robinhood Chain Testnet are stored in a public mapping (
                <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-xs text-amber-100">
                  balanceOf
                </code>
                ) in order to prove deposit, transfer, and withdrawal accounting correctness before swapping in ZK commitments in Phase 2.
              </p>
            </div>
          </div>
          <Link
            href={`https://explorer.testnet.chain.robinhood.com/address/${POOL_ADDR}`}
            target="_blank"
            className="shrink-0 rounded-xl border border-amber-400/30 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
          >
            Inspect Contract Onchain ↗
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: "tiers", label: "Data Tiers (Today vs Phase 2)" },
          { id: "actors", label: "Actor Disclosure Matrix" },
          { id: "failure", label: "Failure Modes & Escape Hatch" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--ultra)] text-white"
                : "text-[rgba(235,221,255,.65)] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Data Tiers */}
      {activeTab === "tiers" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col justify-between border-red-500/20">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-red-400 uppercase">
                  Current State
                </span>
                <Pill tone="muted">Phase A</Pill>
              </div>
              <h2 className="mt-3 text-lg font-bold text-[var(--glow)]">Public Today</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
                Everything required for transparent balance testing is onchain:
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>balanceOf[asset][owner]</strong>: Directly readable mapping for any address.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>Event Logs</strong>: Deposited, Withdrawn, and Transferred logs expose sender, recipient, and amounts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>Total Shielded</strong>: Pool-wide totals for ETH and MockUSDG.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-[var(--text-dim)]">
              No privacy claim is made until Phase 2 is deployed.
            </div>
          </Card>

          <Card className="flex flex-col justify-between border-[var(--ultra)]/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[var(--lilac)] uppercase">
                  Target Architecture
                </span>
                <Pill tone="accent">Phase 2 ZK</Pill>
              </div>
              <h2 className="mt-3 text-lg font-bold text-[var(--glow)]">Private in Phase 2</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
                Replaces public mappings with ZK commitments, nullifiers, and client proving:
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <span>
                    <strong>Private Account Ownership</strong>: Derived secret key controls note commitments.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <span>
                    <strong>Private Balances & Portfolio</strong>: Hidden inside encrypted notes, not public mappings.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ultra)] font-bold">•</span>
                  <span>
                    <strong>Trade Intents & Transfers</strong>: Batched into Trade Waves; individual counterparty link is removed.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 rounded-lg bg-[var(--ultra)]/10 p-3 text-xs text-[var(--lilac)]">
              Prover generates Circom/Groth16 proofs directly in client browser.
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[var(--text-dim)] uppercase">
                  Protocol Boundary
                </span>
                <Pill tone="default">By Design</Pill>
              </div>
              <h2 className="mt-3 text-lg font-bold text-[var(--glow)]">Permanently Public</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)]">
                Actions that interact with the public Robinhood Chain layer can never be invisible:
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[rgba(235,221,255,.85)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <span>
                    <strong>Deposits</strong>: Asset, amount, and depositing wallet entering the pool.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <span>
                    <strong>Withdrawals</strong>: Recipient address, asset, and exit timestamp.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <span>
                    <strong>Wave Aggregates</strong>: Total netted volume executed per wave.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--glow)] font-bold">•</span>
                  <span>
                    <strong>Network Metadata</strong>: IP address and RPC timestamps.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-[var(--text-dim)]">
              Privacy means reducing linkage, not fabricating mathematical magic.
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Actor Disclosure Matrix */}
      {activeTab === "actors" && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-[var(--glow)]">Who Can See What?</h2>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              Explicit evaluation of information access for every participant in the Spectre ecosystem.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-[var(--text-dim)]">
                <tr>
                  <th className="py-3 px-5 sm:px-6">Actor</th>
                  <th className="py-3 px-5 sm:px-6">What they see today (Phase A)</th>
                  <th className="py-3 px-5 sm:px-6">What they see in Phase 2 (ZK)</th>
                  <th className="py-3 px-5 sm:px-6">Worst Case Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {ACTORS.map((a) => (
                  <tr key={a.role} className="hover:bg-white/[0.02]">
                    <td className="py-4 px-5 sm:px-6 font-semibold text-[var(--glow)]">
                      {a.role}
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-xs text-[var(--text-dim)] leading-relaxed">
                      {a.today}
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-xs text-[rgba(235,221,255,.85)] leading-relaxed">
                      {a.phase2}
                    </td>
                    <td className="py-4 px-5 sm:px-6">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-[var(--lilac)]">
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
            <h2 className="text-lg font-bold text-[var(--glow)]">The Self-Custody Escape Hatch</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
              Spectre is engineered so that operator or infrastructure failure can never result in lost or permanently trapped funds. The smart contract acts as an autonomous vault that requires zero backend permission to withdraw.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs font-bold text-[var(--ultra)] uppercase">Invariant 1</span>
                <p className="mt-1 font-semibold text-[var(--glow)]">No Admin Withdrawal</p>
                <p className="mt-1 text-xs text-[var(--text-dim)]">
                  The contract owner has no function to withdraw, seize, or divert any user balance.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs font-bold text-[var(--ultra)] uppercase">Invariant 2</span>
                <p className="mt-1 font-semibold text-[var(--glow)]">Unpausable Exits</p>
                <p className="mt-1 text-xs text-[var(--text-dim)]">
                  Even during an emergency pause triggered by the owner, <code>withdraw()</code> remains 100% active.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs font-bold text-[var(--ultra)] uppercase">Invariant 3</span>
                <p className="mt-1 font-semibold text-[var(--glow)]">Amount Conservation</p>
                <p className="mt-1 text-xs text-[var(--text-dim)]">
                  Contract asset holdings strictly equal or exceed total user claims at all times.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/10">
              <h2 className="text-base font-bold text-[var(--glow)]">Scenario Stress Tests</h2>
            </div>
            <div className="divide-y divide-white/10">
              {SCENARIOS.map((s) => (
                <div key={s.event} className="p-5 sm:p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--ultra)]" />
                    <p className="text-sm font-semibold text-[var(--glow)]">{s.event}</p>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-[var(--text-dim)]">
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
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/proof"
          className="text-xs font-semibold text-[var(--lilac)] hover:text-white"
        >
          ← Explore Public Proofs
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
