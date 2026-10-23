# Trade Wave Architecture

**Status:** draft — Phase 0 research deliverable per developer brief §77C.
**Nothing below is built.** `/app/trade` and `/app/waves` are static mocks
(`src/lib/mock-portfolio.ts`). This document is the design to review and
argue with before Phase 5 (brief §67) starts, not a changelog of existing
code. It assumes `ShieldedPool` (already deployed) as the custody layer
underneath.

## Why this exists (recap)

Per brief §23–§26: the reference pattern (Nullmask-style) hides *who*
traded but still exposes *that a trade of size X happened* per user. Our
differentiator is netting trade intents into one aggregate settlement per
wave, so the chain ideally sees `Wave #184: $86,420 USDG → NVDA` instead of
N individual swaps.

## Components (none exist yet)

```
contracts/
└── src/
    └── waves/
        └── TradeWaveManager.sol      — NEW, not built
services/                              — NEW, not built
├── trade-wave-scheduler/              closes waves on a timer
├── trade-aggregator/                  nets intents inside a closed wave
└── execution-service/                 submits the netted trade to a venue
```

The offchain pieces are the real new infrastructure — `ShieldedPool` alone
cannot do this, by design (it's a passive ledger, not a scheduler).

## Intent format (brief §27)

Conceptual struct (not yet encoded in Solidity):

```
TradeIntent {
  owner;            // the private account authorizing this (not necessarily msg.sender)
  assetIn;
  assetOut;
  amountIn;
  minimumAmountOut; // slippage floor — must never be weakened by the operator (brief §31)
  deadline;
  waveId;           // which wave this is scheduled into
  signature;        // authorization, verified onchain or via ZK proof once Phase 2 lands
}
```

**Open design question, not yet resolved:** does the intent debit
`ShieldedPool.balanceOf` immediately on submission (locking funds for the
wave), or only at settlement? Immediate debit is simpler to reason about
for conservation (brief §62) but means a failed/cancelled wave needs an
explicit refund path (see Failure Recovery below). Recommend: **debit
immediately into an escrowed sub-balance**, refundable if the wave fails —
mirrors how `ShieldedPool.transfer` already moves value between two
`balanceOf` entries, just with `TradeWaveManager` as the temporary holder.

## Encryption / privacy of intents (brief §27, §33, §34)

Three options, increasing complexity:

1. **Plaintext intents, encrypted at rest only** — simplest, but an
   operator or indexer sees the full order book before the wave closes.
   Defeats the point of netting if front-runnable.
2. **Commit-reveal** (brief §34) — submit `hash(intent, salt)` at intent
   time, reveal the full intent only after the wave locks. Prevents
   front-running *within* the wave but the aggregator still sees plaintext
   at reveal time, before execution.
3. **Fully encrypted to a solver/execution set, revealed only in
   aggregate** — strongest, requires either threshold decryption or a
   trusted execution environment for the aggregator. Significant added
   infrastructure.

**Recommendation for the first shipped version: commit-reveal (#2).** It's
a meaningful privacy improvement over plaintext with no new cryptographic
infrastructure beyond what Phase 2 already needs (hashing, basic
commitments). Revisit #3 only if front-running during the reveal→execution
gap proves to be a real, measured problem.

## Aggregation / netting (brief §25, §26)

Within one wave, per asset pair:

```
sum(buy intents) vs sum(sell intents)
  → matched = min(buy_total, sell_total)   — crossed internally, no external execution
  → imbalance = |buy_total - sell_total|   — the only part that touches an external venue
```

**Regulatory/market-structure flag carried over from the brief (§25):**
internal crossing may itself require review — this document does not
resolve that, it only notes the netting math assuming crossing is
permitted.

## Execution venue (brief §30)

Do not build a DEX. `TradeExecutor` → `IExecutionAdapter` → concrete adapter
(e.g. `UniswapAdapter`). Only the *imbalance* after netting hits the
adapter — this is the main privacy property (brief §26): the chain sees one
adapter call per wave per asset pair, not one per user intent.

## Slippage protection (brief §31)

Every intent's `minimumAmountOut` must still hold at settlement time, even
after netting changes the effective execution price. If the netted
imbalance would violate any individual intent's slippage bound, that
intent's portion should fail independently (see Partial Fills) rather than
the operator silently relaxing the bound. This is a hard invariant, not a
nice-to-have — ties directly to brief §60 ("no executor theft").

## Partial fills (brief §32)

Pro-rata, not operator-discretionary:

```
userFill = userRequested × totalFilled / totalRequested
```

Must be computed the same way every time given the same inputs — ideally
enforced onchain in `TradeWaveManager`, not left to an offchain service's
discretion, so it's independently verifiable (ties to brief §35's "public
execution proof").

## Settlement (brief §28 state machine)

```
OPEN → COLLECTING INTENTS → LOCKED → AGGREGATE/NET → QUOTE/EXECUTE
  → SETTLE PRIVATE BALANCES → FINALIZED
```

At `SETTLE`, `TradeWaveManager` credits each participant's `ShieldedPool`
balance according to their pro-rata fill — this is the one place
`TradeWaveManager` needs a trusted (or ZK-proven) relationship with
`ShieldedPool`'s balance-crediting logic. Exact interface TBD; likely a new
`creditFromWave(asset, owner, amount)` function restricted to
`TradeWaveManager`'s address, analogous to how `deposit`/`depositNative`
credit today.

## Failure recovery (brief §28)

```
EXECUTION FAILED → NO USER VALUE LOST → RETRY / REFUND PRIVATE INPUT
```

Concretely: if the external adapter call reverts or returns less than any
locked intent's `minimumAmountOut` can tolerate, the escrowed balance from
"Intent format" above must be refundable back to each participant's
`ShieldedPool.balanceOf`, not left stuck in `TradeWaveManager`. This needs
its own test suite before it ships — analogous to the `ShieldedPool` tests
already covering "cannot drain other users' balance" and "conservation
invariant."

## What this does **not** attempt to resolve

- Exact wave interval (brief §29 — 30s/60s/2min — needs real liquidity and
  MEV research, not armchair judgment)
- MEV mitigation beyond commit-reveal (brief §33's fuller option list:
  RFQ, batch auctions, private solver networks)
- Whether internal crossing is legally permissible for Stock Tokens
  specifically (brief §25's regulatory flag)
- The exact `creditFromWave`-style interface between `TradeWaveManager` and
  `ShieldedPool` — sketched above, not finalized or reviewed

## Dependency on `ROBINHOOD_ASSET_MATRIX.md`

Trade Waves cannot be tested against real Stock Tokens until that matrix
has at least one independently-verified, liquid asset beyond ETH and our
`MockUSDG`. See that document's "V1 scope recommendation."
