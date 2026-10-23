# ZK Stack Decision

**Status:** draft — Phase 0 research deliverable per developer brief §77B.
**No decision has been implemented yet.** `ShieldedPool` is still Phase A
(transparent, public balances). This document exists to be reviewed and
argued with *before* anyone writes a circuit, per brief §8: "do not invent a
new proof system," and §66: prove the transparent logic first.

## What we actually need circuits for

Reading brief §15 (private transfer) and §13–§14 (private balance), Phase 2
needs ZK proofs for roughly three statements:

1. **Spend proof**: "I know the secret behind a commitment in the tree, it
   hasn't been nullified yet, and I'm consuming exactly `amount` of it."
2. **Transfer/withdraw proof**: spend proof + "the new commitment(s) sum to
   the same value, minus any amount leaving the pool."
3. **(Later) Trade intent proof**: spend proof + "this authorizes a trade
   with these slippage bounds, for this wave" (brief §27, §31).

None of these need recursion, custom gadgets beyond standard Merkle/hash
circuits, or anything exotic. This favors mature, boring tooling over
cutting-edge options.

## Candidates compared

| Criterion | Noir + Barretenberg (UltraPlonk) | Circom + Groth16 | Halo2 |
|---|---|---|---|
| **EVM verifier cost** | Moderate (~300–500k gas typical for Plonk-family verifiers) | Lowest of the three — Groth16 verification is ~200–250k gas, the cheapest pairing-based option | Higher — no pairing-based shortcut; verifier cost depends heavily on custom gate design, typically more expensive on EVM unless using a KZG-based variant |
| **Proof generation time (browser/mobile)** | Improving fast (Barretenberg has WASM + planned GPU backends); still heavier than Groth16 for equivalent circuits | Historically the best-proven path for browser proving (snarkjs + WASM is mature, used in production by Tornado-style and Semaphore-style systems) | Weakest here — Halo2 provers are typically native-first (Rust); browser/WASM story is less mature as of our research pass |
| **Developer experience** | Best of the three — Noir is a purpose-built, readable DSL (not a general circuit compiler bolted onto a language), actively developed by Aztec | Circom is lower-level (explicit signal/constraint wiring), more error-prone, but extremely well documented with years of production examples | Rust-based circuit APIs are the most verbose and have the steepest learning curve of the three |
| **Trusted setup** | Barretenberg's UltraPlonk uses a **universal, already-run** KZG ceremony (no per-circuit ceremony needed) | Groth16 needs a **per-circuit trusted setup ceremony** — real operational overhead and a genuine trust assumption per circuit we ship | No trusted setup (uses IPA or a KZG variant depending on config) — a real advantage if this weighs heavily |
| **Tool maturity** | Younger (Noir 1.0-era tooling, actively changing) | Most mature of the three — multi-year production track record (Tornado Cash, Semaphore, zkSync-adjacent tooling) | Mature cryptography, less mature *application* tooling — fewer end-to-end examples of "ship a dApp with this" |
| **Audit ecosystem** | Smaller audit firm pool has reviewed Noir circuits so far | Largest audit track record of the three — most firms have reviewed Circom circuits before | Smaller than Circom, comparable to or slightly ahead of Noir |
| **Circuit complexity for our use case** | Low — our 3 statements above are simple enough that Noir's higher-level abstractions are a net win, not a liability | Low, but every added signal is manual wiring — more places to introduce a subtle bug | Low circuit complexity doesn't offset the steeper API |
| **Recursive proof requirements** | Not needed for Phase 2/3 scope (§1 above has no recursion) — advantage goes to whichever is otherwise best | Same — not a differentiator here | Halo2's standout feature (recursion without trusted setup) is **irrelevant to our current scope** |

## Recommendation (provisional — needs independent review per brief §7)

**Circom + Groth16** for the first shipped circuits (spend, transfer/withdraw),
revisited for Trade Wave intents in Phase 5:

- Lowest EVM verifier gas cost matters directly to user-facing withdrawal/
  transfer fees (brief §57 — avoid fee stacking).
- Deepest production track record and audit pool lowers the chance of a
  subtle circuit bug shipping to mainnet — directly serves brief §60's
  "no commitment forgery / no proof replay" invariants.
- Browser proving via snarkjs is the most proven path for the "client-side
  proving" option brief §18 prefers for privacy (prover never sees the
  witness).

**Explicit tradeoff being accepted:** a trusted setup ceremony per circuit.
Mitigate with a well-documented multi-party ceremony (Perpetual Powers of
Tau + circuit-specific phase 2), not a single-party setup — and state this
limitation plainly in any public-facing privacy claims (ties to brief §70:
no absolute claims unless proven).

**Revisit Noir** once its browser-proving story and audit ecosystem mature
further — it is a credible second choice and the better long-term bet if
tooling velocity continues, just not yet for a first ship.

## Hybrid proving architecture (brief §18)

Independent of which circuit language wins: start with **client-side
proving only**. The relayer in `src/lib` does not exist yet, and nothing in
the current `ShieldedPool` requires remote proving. Revisit "small proofs
client-side, heavy proofs optionally remote" only if real-world mobile
proving times prove unacceptable — don't add a remote prover (and its
witness-exposure risk, see `PRIVACY_THREAT_MODEL.md` §4) before it's needed.

## Open questions for independent review

- Has anyone run proof-generation benchmarks for our *actual* circuit sizes
  (not generic benchmarks) on a representative low-end mobile device?
- What's the real cost, in time and dollars, of a Powers-of-Tau-style
  ceremony credible enough to state publicly?
- Does Robinhood Chain (Arbitrum Orbit) have any precompile or gas-cost
  quirks relative to plain Ethereum L1 that change the EVM verifier cost
  comparison above? Not yet investigated.
