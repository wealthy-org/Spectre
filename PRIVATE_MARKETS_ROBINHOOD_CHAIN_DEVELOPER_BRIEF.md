# PRIVATE MARKETS ON ROBINHOOD CHAIN
## Developer Brief — Working Name TBD

**Status:** Product + technical architecture brief  
**Version:** v0.1  
**Chain:** Robinhood Chain  
**Project name:** **TBD**  
**Reference product:** Nullmask  
**Primary differentiation:** **Trade Waves + private Stock Token portfolios**  
**Core product line:** **Your portfolio shouldn't be public.**

---

# 0. Purpose

This project takes the proven privacy-product pattern demonstrated by Nullmask and adapts it to Robinhood Chain with a clear point-plus.

```text
PUBLIC WALLET
↓
SHIELD ASSETS
↓
SHARED SHIELDED POOL
↓
PRIVATE BALANCE
↓
PRIVATE TRANSFERS / TRADES / WITHDRAWALS
```

Our additional primitive is:

```text
TRADE WAVES
+
PRIVATE STOCK TOKEN PORTFOLIOS
```

The goal is **not** to copy proprietary code, branding, or unverifiable security claims. The goal is to reproduce the product primitive with our own implementation and add a Robinhood-native execution layer.

Developer mental model:

> **A private execution and portfolio layer for Robinhood Chain.**

Not a mixer, not a token-first project, and not a generic ZK experiment.

---

# 1. Reference Product — Nullmask

Nullmask's public docs describe the following flow:

```text
EXISTING WALLET
↓
SIGN MESSAGE
↓
PRIVATE ACCOUNT / PRIVATE BALANCE
↓
DEPOSIT INTO SHARED POOL
↓
PRIVATE ACTIONS
• private transfer
• swap
• withdrawal
↓
RELAYER SUBMITS ACTION
↓
ONCHAIN CONTRACT
```

Important reference behaviors:

```text
• user keeps their existing wallet
• deposits enter a shared smart-contract pool
• funds from many users coexist in that pool
• a relayer submits private actions onchain
• withdrawals still expose recipient, asset, amount, and time
• deposit ↔ withdrawal linkage is reduced rather than magically erased
• Withdrawal Waves deliberately delay withdrawals into scheduled windows
• standard withdrawal amounts and split withdrawals reduce correlation
• current Nullmask swaps still expose swapped assets and amounts onchain
• Withdrawal Waves apply to withdrawals, not swaps
```

Reference docs:

```text
https://nullmask.io/docs
https://nullmask.io/docs/deposit
https://nullmask.io/docs/swap
https://nullmask.io/docs/withdraw
https://nullmask.io/docs/fees
https://nullmask.io/docs/faq
https://app.nullmask.io/waves
```

This creates our main product opening:

> **Apply the wave concept to trading itself.**

---

# 2. Robinhood Chain Context

Robinhood Chain is an EVM-compatible Layer 2 and supports normal Solidity tooling.

Recommended stack:

```text
Smart contracts: Solidity + Foundry
Libraries: OpenZeppelin
Frontend: Next.js + TypeScript
Web3: viem + wagmi
Backend services: Node.js + TypeScript
Database: PostgreSQL
RPC / infra: production-grade Robinhood Chain provider
Admin: multisig
```

Robinhood Chain is particularly relevant because Stock Tokens are standard ERC-20 assets with onchain pricing and composability.

Official docs:

```text
https://docs.robinhood.com/chain/
https://docs.robinhood.com/chain/stock-tokens/
https://docs.robinhood.com/chain/contracts/
```

Use the official public-facing term:

```text
Stock Tokens
```

---

# 3. Product Thesis

Public wallets reveal too much:

```text
what you own
how much you own
when you bought
when you sold
where assets moved
how large your positions are
what your strategy may be
```

Our thesis:

> **Your portfolio shouldn't be public.**

Target flow:

```text
SHIELD
↓
PRIVATE BALANCE
↓
PRIVATE PORTFOLIO
↓
PRIVATE TRADE INTENTS
↓
TRADE WAVES
↓
PUBLICLY VERIFIABLE SETTLEMENT
↓
WITHDRAWAL WAVES
```

The system should optimize for:

```text
privacy
self-custody
public verification
simple UX
```

while accurately documenting anything that remains public.

---

# 4. Product Positioning

Working category:

> **Private Markets on Robinhood Chain**

Alternative internal descriptions:

```text
Private trading layer
Shielded portfolio layer
Private Stock Token execution layer
Shielded market infrastructure
```

Primary line:

> **Your portfolio shouldn't be public.**

Do not use absolute claims such as:

```text
100% anonymous
untraceable
total privacy
impossible to track
```

unless independently proven by the final architecture.

Prefer precise terms:

```text
private balance
shielded ownership
reduced transaction linkage
batched execution
private portfolio state
public settlement proof
```

---

# 5. Core Product Loop

```text
CONNECT WALLET
↓
DERIVE PRIVATE ACCOUNT
↓
SHIELD ASSET
↓
PRIVATE BALANCE
↓
USER CAN:
├── PRIVATE SEND
├── PRIVATE TRADE
├── PRIVATE PORTFOLIO REBALANCE
└── WITHDRAW
↓
TRADE WAVES / WITHDRAWAL WAVES
↓
ROBINHOOD CHAIN SETTLEMENT
```

The UX should feel like a normal wallet with a private layer, not like a cryptography dashboard.

---

# 6. System Layers

Treat the product as five separate layers:

```text
1. CUSTODY
   Shared Shielded Pool

2. OWNERSHIP
   Commitments + Nullifiers + ZK proofs

3. TRANSPORT
   Relayer

4. EXECUTION
   Trade Waves + execution adapters

5. PRIVACY UX
   Withdrawal Waves + timing + standard amounts + portfolio UI
```

Do not collapse these into one opaque backend.

---

# 7. High-Level Architecture

```text
PUBLIC WALLET
      │
      │ sign / deposit
      ▼
PRIVATE ACCOUNT KEY LAYER
      │
      ▼
SHIELDED POOL
      │
      ├── PRIVATE BALANCES
      ├── PRIVATE TRANSFERS
      ├── PRIVATE TRADE INTENTS
      └── PRIVATE WITHDRAWAL INTENTS
      │
      ▼
ZK PROOF LAYER
      │
      ▼
RELAYER / EXECUTOR
      │
      ├── TRADE WAVE EXECUTION
      └── WITHDRAWAL WAVE EXECUTION
      │
      ▼
ROBINHOOD CHAIN
```

---

# 8. Do Not Invent New Cryptography

The team should **not** create a novel ZK proof system.

Evaluate mature stacks such as:

```text
Noir + Barretenberg
Circom + Groth16
Halo2
zkVM-based approaches where appropriate
```

Score candidates on:

```text
EVM verifier cost
proof generation time
browser / mobile feasibility
trusted setup requirements
tool maturity
audit ecosystem
circuit complexity
recursive proof requirements
```

Our innovation should be in product-specific circuits and execution architecture, not in new cryptographic foundations.

---

# 9. Shared Shielded Pool

A shared shielded pool is one smart-contract pool containing assets belonging privately to many users.

Public chain may see:

```text
Pool balance:
1,420 ETH
3.2M stablecoins
18,400 NVDA Stock Tokens
...
```

but should not expose a simple mapping like:

```text
Alice = X
Bob = Y
Charlie = Z
```

Private ownership should be represented by commitments / notes / encrypted state.

Potential architecture:

```text
ShieldedPool
├── commitment tree
├── nullifier registry
├── approved asset registry
├── deposit logic
├── spend verification
├── withdrawal authorization
└── private state commitments
```

---

# 10. Commitments

Conceptually, a private ownership commitment may represent:

```text
Hash(
  asset,
  amount,
  owner secret,
  randomness
)
```

This formula is illustrative only.

The production commitment scheme must be specified by the ZK developer and independently reviewed.

The chain stores the commitment, not the private owner mapping.

---

# 11. Nullifiers

Nullifiers prevent double spending.

```text
PRIVATE NOTE
↓
SPENT
↓
NULLIFIER PUBLISHED
```

The contract must reject any nullifier already used.

Required invariant:

```text
one private unit of value
cannot be spent twice
```

---

# 12. Private Account Key

Target UX:

```text
CONNECT NORMAL WALLET
↓
SIGN DETERMINISTIC MESSAGE
↓
DERIVE PRIVATE ACCOUNT KEY
```

Use strong domain separation.

Conceptual signing context:

```text
PROJECT: TBD
CHAIN: Robinhood Chain
PURPOSE: Private Account Key Derivation
VERSION: 1
```

Never derive private credentials from an ambiguous generic signature.

Do not store the derived private secret on the backend.

---

# 13. Deposit Flow

```text
PUBLIC WALLET
↓
choose supported asset
↓
enter amount
↓
approve ERC-20 if required
↓
deposit
↓
asset enters ShieldedPool
↓
private commitment created
↓
private balance credited
```

Deposits are public blockchain actions.

The system must not claim deposits are invisible.

Privacy comes from making later ownership and activity harder to link back to the original deposit.

---

# 14. Private Balance

Application target:

```text
PRIVATE PORTFOLIO

USDG      $8,000
NVDA      $5,143
TSLA      $3,921
AAPL      $3,082
ETH       $4,219

TOTAL     $24,365
```

Do **not** implement private state as:

```solidity
mapping(address => mapping(address => uint256)) public balance;
```

The private state should be reconstructed from authenticated private notes / commitments and user-controlled keys.

---

# 15. Private Transfer

```text
ALICE PRIVATE BALANCE
↓
5,000 USDG
↓
BOB PRIVATE ACCOUNT
```

The public chain should not trivially expose:

```text
Alice → Bob
```

The proof system should verify:

```text
valid ownership
amount conservation
valid recipient commitment
no double spend
```

---

# 16. Relayer

The relayer submits private actions on behalf of users.

Without relayer:

```text
user generates proof
↓
user wallet submits tx
↓
public wallet appears as tx sender
```

With relayer:

```text
user authorizes action
↓
relayer submits transaction
↓
contract verifies proof
```

Target security property:

```text
RELAYER MAY CENSOR
BUT CANNOT STEAL
```

The relayer must not possess:

```text
user spending key
ability to forge proof
ability to redirect withdrawal
ability to weaken signed slippage limits
```

---

# 17. Relayer Decentralization Direction

V1 may begin with:

```text
team relayer
```

but architecture should support:

```text
Relayer A
Relayer B
Relayer C
self-relay
```

because one relayer creates a liveness and censorship dependency.

---

# 18. Prover Architecture

Evaluate three modes.

## Client-Side

```text
browser/device
↓
generate proof
↓
relayer
```

Pros:

```text
stronger privacy
less backend knowledge
```

Cons:

```text
CPU / memory load
mobile constraints
slow proof generation
```

## Remote Prover

```text
client
↓
prover service
↓
proof
↓
relayer
```

Pros:

```text
better UX
```

Cons:

```text
possible metadata / witness leakage
operator dependency
```

## Hybrid

Recommended research direction:

```text
small proofs client-side
heavy proofs optionally remote
```

---

# 19. Fast Withdrawal

```text
PRIVATE BALANCE
↓
ZK PROOF
↓
RELAYER
↓
SHIELDED POOL
↓
PUBLIC DESTINATION
```

Publicly visible after exit:

```text
recipient
asset
amount
time
pool
```

The product should aim to hide the private ownership/history path, not pretend the public exit itself is invisible.

---

# 20. Withdrawal Waves

Withdrawal Waves are intentional timing delays, not network congestion.

Example:

```text
10:03 Alice requests withdrawal
10:06 Bob requests withdrawal
10:09 Charlie requests withdrawal
10:12 David requests withdrawal

↓
10:15 WAVE
↓
multiple withdrawals leave around the same scheduled window
```

Purpose:

```text
reduce direct deposit ↔ withdrawal timing correlation
```

Recommended V1 testnet interval:

```text
15 minutes
```

Keep configurable during testnet.

---

# 21. Standard Withdrawal Amounts

Unique withdrawal amounts are easier to correlate.

Frontend should suggest common denominations.

Examples only:

```text
STABLECOIN
250
500
1,000
3,000

ETH
0.1
0.5
1.0
```

User may still choose custom amounts, but UI should explain the privacy tradeoff.

---

# 22. Split Withdrawal

Advanced mode should support:

```text
ONE PRIVATE BALANCE
↓
2–5 PARTS
↓
DIFFERENT WAVES
↓
PREFER DIFFERENT DESTINATION ADDRESSES
```

Example:

```text
2,000 USDG

Wave A: 500 → Address A
Wave B: 500 → Address B
Wave C: 500 → Address C
Wave D: 500 → Address D
```

Each part must be independently trackable and fail independently.

---

# 23. Main Differentiator — Trade Waves

This is the primary point-plus over the reference product.

Reference swap model:

```text
user identity hidden
BUT
asset pair + amount may still appear publicly
```

Our direction:

> **Private trade intents accumulate into scheduled execution windows rather than exposing every user trade as an individual execution.**

---

# 24. Trade Wave Concept

Users submit private trade intents.

Example:

```text
Alice:   buy $5,000 NVDA
Bob:     sell $8,000 NVDA
Charlie: buy $2,000 NVDA
David:   buy $10,000 AAPL
```

Instead of immediately producing four public user trades:

```text
PRIVATE TRADE INTENT QUEUE
↓
WAVE CLOSES
↓
AGGREGATE / NET
↓
EXECUTE
↓
PRIVATE BALANCES UPDATE
```

---

# 25. Trade Wave Netting Example

Within one wave:

```text
NVDA BUY INTENTS
$100,000

NVDA SELL INTENTS
$70,000
```

Potential conceptual flow:

```text
$70,000 internal cross
↓
remaining imbalance
$30,000 BUY
↓
external execution only for imbalance
```

This is an architectural target, not automatically approved production behavior.

Internal crossing may have regulatory, market-structure, and execution implications that require review.

---

# 26. Trade Wave Privacy Target

Public chain should ideally see something closer to:

```text
TRADE WAVE #184

Aggregate execution:
$86,420 USDG → NVDA
```

instead of:

```text
wallet A swapped $5,000
wallet B swapped $12,000
wallet C swapped $900
...
```

Final privacy claims must be based on actual calldata, events, execution venue, and settlement design.

---

# 27. Trade Intent

Conceptual intent fields:

```text
assetIn
assetOut
amountIn
minimumAmountOut
deadline
waveId
owner authorization
private commitment reference
```

Sensitive intent data should not automatically become plaintext calldata.

Potential architecture:

```text
encrypted intent
+
commitment
+
ZK authorization proof
```

Exact design is TBD.

---

# 28. Trade Wave State Machine

```text
OPEN
↓
COLLECTING INTENTS
↓
LOCKED
↓
AGGREGATE / NET
↓
QUOTE / EXECUTE
↓
SETTLE PRIVATE BALANCES
↓
FINALIZED
```

Failure path:

```text
EXECUTION FAILED
↓
NO USER VALUE LOST
↓
RETRY / REFUND PRIVATE INPUT
```

---

# 29. Trade Wave Frequency

Trading requires lower latency than withdrawals.

Research:

```text
30 seconds
60 seconds
2 minutes
```

Evaluate each on:

```text
privacy set
price movement
slippage
UX
liquidity
MEV
execution cost
```

Do not default to 15-minute trade waves unless deliberately using an auction-like market model.

---

# 30. Execution Venue

Do not build a DEX from scratch in V1.

Use existing Robinhood Chain liquidity via adapters.

Possible architecture:

```text
TradeExecutor
↓
IExecutionAdapter
├── UniswapAdapter
├── RialtoAdapter
└── FutureAdapter
```

The exact venues must be verified for supported assets and liquidity before production.

---

# 31. Slippage Protection

Every user trade authorization must define protection such as:

```text
amountIn
minimumAmountOut
expiry
```

A wave may only execute if user constraints remain valid.

Operator must not be able to weaken signed slippage limits.

---

# 32. Partial Fill Allocation

If:

```text
100K requested
70K executable
```

use a deterministic rule.

Recommended default candidate:

```text
PRO-RATA
```

Formula:

```text
userFill = userRequested × totalFilled / totalRequested
```

Do not allow operator discretion over who gets filled first unless the rule is explicit and verifiable.

---

# 33. MEV / Execution Risk

Trade Waves may create valuable aggregate flow.

Threats:

```text
front-running
sandwiching
executor leakage
quote manipulation
wave imbalance leakage
solver favoritism
```

Evaluate:

```text
commit-reveal
encrypted intent submission
RFQ
batch auctions
MEV-protected routing
private solver network
```

Never publicly expose wave imbalance before execution if that creates exploitable information.

---

# 34. Commit-Reveal Option

Potential pattern:

```text
USER
↓
commit encrypted trade intent
↓
WAVE CLOSES
↓
reveal / prove authorization
↓
aggregate
↓
execute
```

Research whether reveal can remain private to execution infrastructure while settlement remains verifiable.

---

# 35. Public Execution Proof

Every settled Trade Wave should expose public proof of system behavior.

Public:

```text
wave ID
aggregate input
aggregate output
execution venue
execution transaction
execution price
settlement root
timestamp
```

Private:

```text
which user owned which fraction
individual user portfolio
individual order ownership
```

Target:

```text
PRIVATE USERS
+
PUBLIC SYSTEM ACCOUNTABILITY
```

---

# 36. Private Stock Token Portfolio

Robinhood-native product layer:

```text
PRIVATE PORTFOLIO
```

Example:

```text
PUBLIC WALLET
20,000 USDG
↓
SHIELD
↓
PRIVATE PORTFOLIO

NVDA   $5,000
TSLA   $4,000
AAPL   $3,000
USDG   $8,000
```

The public wallet should not trivially expose the final portfolio composition.

---

# 37. Stock Token Integration

Robinhood Stock Tokens are standard ERC-20 assets.

Developer must account for:

```text
18-decimal token accounting
onchain price feeds
corporate-action multiplier
splits
trading halts
asset availability
jurisdiction restrictions
liquidity availability
```

Do not assume:

```text
1 token = 1 underlying share forever
```

Use official Robinhood token and oracle semantics.

---

# 38. Corporate Actions

Robinhood Stock Tokens use a UI multiplier mechanism.

Portfolio logic must distinguish:

```text
RAW ONCHAIN BALANCE
vs
DISPLAY / ECONOMIC BALANCE
```

Explicit tests:

```text
stock split
reverse split
multiplier update
asset halt
oracle outage
```

---

# 39. V1 Asset Scope

Do not support hundreds of assets initially.

Recommended V1 research scope:

```text
ETH
one verified stable asset
2–5 liquid Stock Tokens later
```

Stock Token support depends on:

```text
liquidity
execution venue
oracle
legal/compliance review
```

---

# 40. What the Operator Can See

Before production coding, write:

```text
PRIVACY_THREAT_MODEL.md
```

Answer explicitly:

```text
Can operator identify depositing wallet?
Can operator reconstruct private balances?
Can operator see sender / recipient?
Can operator see exact trade amount?
Can operator see trade pair?
Can relayer correlate request IP?
Can prover reconstruct user history?
Can backend reconstruct portfolio?
Can executor link trade intent to user?
```

Do not let this remain implicit.

---

# 41. Network Metadata

ZK does not automatically hide:

```text
IP address
browser fingerprint
request timing
RPC metadata
```

Potential later improvements:

```text
privacy proxy
Tor support
request batching
delayed submission
encrypted queues
```

Do not claim network-level anonymity in V1.

---

# 42. Frontend Privacy Rules

Do not send sensitive app data to ordinary analytics providers.

Avoid automatically exposing:

```text
wallet address
private trade pair
private amount
withdrawal destination
private portfolio state
```

to third parties.

Separate:

```text
PUBLIC MARKETING SITE
from
PRIVATE APP
```

Prefer no third-party tracking inside core private flows.

---

# 43. Privacy Score — Optional Phase 2

Potential additional feature:

```text
PRIVACY ESTIMATE
42 / 100

Wait ~2 hours
Use a standard amount
Join a later wave

Estimated:
81 / 100
```

Inputs may include:

```text
amount uniqueness
time since deposit
wave crowd size
destination reuse
split withdrawal
```

This must be presented as heuristic guidance, not a cryptographic guarantee.

---

# 44. Compliance Layer

Privacy infrastructure requires explicit legal and compliance review.

Controls to evaluate:

```text
deposit screening
sanctions screening
withdrawal destination screening
jurisdiction restrictions
risk-based limits
compliance proofs later
```

If the system can refuse exits or deposits, document:

```text
who has authority
under what conditions
what appeal / safe-exit path exists
```

Do not silently introduce custodial control.

---

# 45. Escape Hatch

Required question:

> What happens if our frontend, relayer, prover, or company disappears?

Preferred architecture:

```text
USER
↓
independent proof / exit tooling
↓
contract
↓
withdraw
```

At minimum, contracts should remain usable with independent tooling.

Operator outage should not equal permanent fund loss.

---

# 46. Upgradeability

Avoid one EOA controlling privacy verification logic.

Recommended:

```text
MULTISIG
+
TIMELOCK
+
PUBLIC UPGRADE DELAY
```

Critical components:

```text
ShieldedPool
Verifier contracts
Commitment / state registry
```

should be immutable where practical, or have heavily constrained upgrade authority.

---

# 47. Admin Matrix

| Capability | Recommended Authority |
|---|---|
| Add supported asset | Multisig |
| Change wave interval | Multisig / bounded config |
| Add execution adapter | Multisig |
| Pause new deposits | Guardian |
| Pause new trades | Guardian |
| Withdraw user funds | **Never** |
| Forge private balance | **Never** |
| Create proof without user secret | **Never** |
| Upgrade verifier | Timelock + multisig if upgradeable |
| Treasury | Multisig |

---

# 48. Emergency Pause

Pause may block:

```text
new deposits
new trades
new private transfers
```

but should preserve safe exit where technically possible.

Do not create a pause switch that can permanently freeze legitimate user funds.

---

# 49. Suggested Smart Contract Layout

```text
contracts/
│
├── ShieldedPool.sol
├── CommitmentTree.sol
├── NullifierRegistry.sol
├── PrivacyAccountRegistry.sol
│
├── verifier/
│   ├── SpendVerifier.sol
│   ├── TransferVerifier.sol
│   ├── WithdrawVerifier.sol
│   └── TradeIntentVerifier.sol
│
├── waves/
│   ├── WithdrawalWaveManager.sol
│   └── TradeWaveManager.sol
│
├── execution/
│   ├── TradeExecutor.sol
│   ├── IExecutionAdapter.sol
│   ├── UniswapAdapter.sol
│   └── future/
│
├── assets/
│   └── AssetRegistry.sol
│
└── treasury/
    └── FeeTreasury.sol
```

Exact boundaries depend on the ZK design.

---

# 50. Offchain Services

```text
services/
│
├── relayer/
├── prover/
├── withdrawal-wave-scheduler/
├── trade-wave-scheduler/
├── trade-aggregator/
├── execution-service/
├── indexer/
├── privacy-risk-engine/
└── monitoring/
```

Rule:

```text
OFFCHAIN SERVICES
may improve UX and liveness

but must not be able to invent ownership
```

---

# 51. Data Storage

Avoid storing plaintext mappings such as:

```text
wallet ↔ private account
private balance
trade ownership
portfolio composition
withdrawal ownership
```

on backend unless absolutely necessary.

Prefer:

```text
encrypted client state
encrypted notes
public commitments
minimal metadata
```

Define a deliberate retention policy.

---

# 52. Frontend Pages

Recommended:

```text
/
Landing

/app
Private portfolio

/shield
Deposit

/trade
Private trade

/waves
Trade + withdrawal wave status

/send
Private transfer

/withdraw
Fast / advanced withdrawal

/activity
Private client-side activity

/proof
Public protocol proof

/privacy
What is / is not private
```

---

# 53. Private Portfolio UI

Primary app screen:

```text
PRIVATE PORTFOLIO

Total
$24,365

USDG
$8,000

NVDA
$5,143

TSLA
$3,921

AAPL
$3,082

ETH
$4,219
```

Actions:

```text
SHIELD
TRADE
SEND
WITHDRAW
```

Wave status:

```text
NEXT TRADE WAVE
00:42

NEXT WITHDRAWAL WAVE
08:42
```

---

# 54. Trade UI

Example:

```text
YOU PAY
5,000 USDG

YOU RECEIVE
≈ NVDA Stock Token

Execution:
Next Trade Wave

Wave closes:
00:31

Minimum received:
...

Estimated fee:
...

[SUBMIT PRIVATE TRADE]
```

After submission:

```text
TRADE COMMITTED

Wave #184
Pending settlement
```

Do not claim the order is private until the implementation supports that exact statement.

---

# 55. Wave Dashboard

Public stats may include:

```text
TOTAL SHIELDED VALUE
PRIVATE VOLUME
TRADE WAVES SETTLED
WITHDRAWAL WAVES SETTLED
LATEST WAVE
AGGREGATE VOLUME
EXECUTION VENUE
TX HASH
```

Never expose user identities through the dashboard.

---

# 56. Public Proof Page

Per Trade Wave:

```text
TRADE WAVE #184

Started
...

Closed
...

Settlement Root
...

Aggregate Input
...

Aggregate Output
...

Execution Venue
...

Execution Price
...

Execution TX
...

Settlement TX
...

STATUS
VERIFIED
```

---

# 57. Fees

Do not finalize fees before simulation.

Potential sources:

```text
shield fee
trade execution fee
withdrawal fee
relayer / network surcharge
```

Avoid fee stacking.

Every fee must be shown before signing.

---

# 58. Token — Not Required for V1

Do not force a token into the first build.

Preferred progression:

```text
TESTNET
↓
SECURITY
↓
MAINNET PRODUCT
↓
REAL PRIVATE VOLUME
↓
TOKEN ECONOMICS LATER
```

If token utility is added later, connect it to real protocol functions such as:

```text
revenue
governance
relayer incentives
prover incentives
security / staking
```

not artificial utility.

---

# 59. Threat Model

Required actors:

```text
malicious relayer
malicious prover
malicious executor
malicious admin
external blockchain analyst
RPC provider
frontend compromise
MEV searcher
colluding users
malicious / sanctioned user
```

For each define:

```text
what they know
what they can do
what they cannot do
worst-case failure
mitigation
```

---

# 60. Security Invariants

Must guarantee:

```text
no double spend
no commitment forgery
no nullifier replay
no withdrawal without ownership
no trade without ownership
amount conservation
asset conservation
no executor theft
no relayer theft
no admin drain
no proof replay
no chain-domain replay
```

---

# 61. Privacy Requirements

Public state should not trivially reveal:

```text
private account owner
private transfer recipient
private balance
complete portfolio
individual trade ownership
internal transfer graph
```

Anything that remains visible must be documented explicitly.

---

# 62. Conservation Invariant

For each supported asset:

```text
TOTAL ASSET IN SYSTEM
>=
TOTAL UNSPENT PRIVATE CLAIMS
+
PENDING WITHDRAWALS
+
PENDING TRADE OBLIGATIONS
```

After fees and external execution:

```text
assets cannot appear or disappear
without a defined state transition
```

---

# 63. Trade Settlement Invariant

For a settled wave:

```text
total user debit
=
aggregate amount executed
+
fees
+
explicit refund / remainder
```

and:

```text
total output credited
=
actual output received
```

No operator-created balances.

---

# 64. Test Suite

Required tests include:

```text
deposit
multiple deposits
commitment creation
Merkle membership
valid spend proof
invalid proof
wrong root
double nullifier
private transfer
withdrawal
double withdrawal
relayer redirect attempt
modified recipient
modified trade limits
wave enrollment
wave cancellation
wave timing
split withdrawal
failed split part
trade intent
trade wave lock
aggregation
partial fill
pro-rata fill
slippage failure
execution failure
settlement recovery
Stock Token multiplier behavior
pause / exit
admin access control
```

---

# 65. ZK Circuit Tests

For every circuit:

```text
valid witness → pass
invalid ownership → fail
wrong amount → fail
wrong asset → fail
wrong Merkle path → fail
spent note → fail
modified destination → fail
modified minimum output → fail
wrong chain domain → fail
wrong protocol version → fail
```

Add fuzz / property tests for amount conservation.

---

# 66. Development Strategy

Do **not** start by making everything private.

First prove the market/execution logic transparently.

## Phase A — Transparent Prototype

```text
public mock balances
public trade intents
Trade Wave scheduler
execution adapter
portfolio accounting
settlement
```

Goal:

> prove Trade Waves are useful and economically correct.

Then:

## Phase B — Privacy Replacement

```text
replace public ownership state
with commitments + nullifiers + ZK proofs
```

This avoids hiding ordinary accounting bugs behind cryptographic complexity.

---

# 67. Build Phases

## Phase 0 — Research

Deliver:

```text
PRIVACY_THREAT_MODEL.md
ZK_STACK_DECISION.md
ROBINHOOD_ASSET_MATRIX.md
TRADE_WAVE_EXECUTION_RESEARCH.md
```

Answer:

```text
Which ZK stack?
Client or remote proving?
How does recovery work?
Which execution venue?
Which assets?
How can users exit if operator disappears?
```

## Phase 1 — Transparent Trade Wave Prototype

Build:

```text
Trade Wave scheduler
trade intent model
aggregation
execution adapter
portfolio accounting
frontend
```

## Phase 2 — Shielded Deposit / Withdrawal

Build:

```text
commitment tree
nullifiers
spend circuit
withdraw circuit
relayer
```

Start with ETH + one stable asset.

## Phase 3 — Private Transfer

Build:

```text
note-to-note private transfer
recipient encryption
client-side private state discovery
```

## Phase 4 — Withdrawal Waves

Build:

```text
scheduled exits
standard amounts
split withdrawal
address-reuse warnings
wave proof automation
```

## Phase 5 — Private Trade Intent

Build:

```text
shielded balance
↓
private trade authorization
↓
Trade Wave
↓
private settlement
```

## Phase 6 — Stock Token Support

Add a very small supported set.

Test:

```text
liquidity
oracle
corporate actions
multiplier
execution
settlement
```

## Phase 7 — Security Review

Required:

```text
smart-contract audit
ZK circuit audit
key-derivation review
relayer review
frontend privacy review
threat-model review
```

## Phase 8 — Mainnet

Only after:

```text
audit issues resolved
safe exit verified
admin model published
privacy claims reviewed
legal/compliance review completed
```

---

# 68. MVP vs Point-Plus

## MVP

```text
Robinhood Chain
ETH + stable asset
shared shielded pool
private balance
private transfer
fast withdrawal
withdrawal waves
non-custodial relayer
```

## Primary Point-Plus

```text
TRADE WAVES
```

## Robinhood-Native Expansion

```text
PRIVATE STOCK TOKEN PORTFOLIOS
```

Do not force all layers into the first release if that compromises security.

---

# 69. What We Copy From the Proven Pattern

```text
existing wallet
↓
shield
↓
shared pool
↓
private balance
↓
private actions
↓
relayer
↓
wave-based withdrawal
```

This is product inspiration.

---

# 70. What We Do Not Copy

Do not copy:

```text
Nullmask name
brand
logo
copywriting
website layout 1:1
closed-source / proprietary code
unverified technical claims
```

Build an independent implementation and security model.

---

# 71. What We Add

Primary:

```text
TRADE WAVES
```

Secondary:

```text
PRIVATE STOCK TOKEN PORTFOLIOS
```

Conceptual difference:

```text
REFERENCE MODEL
shield transactions
+
withdrawal waves

OUR DIRECTION
shield portfolio
+
trade waves
+
withdrawal waves
```

---

# 72. Product-Generated Attention

Natural milestones:

```text
First Shielded Deposit
First Private Transfer
First Withdrawal Wave
First Trade Wave
First $100K Private Volume
First Stock Token Trade Wave
$1M Shielded Value
100 Trade Waves Settled
10K Private Trades
```

This gives the project a continuous proof/content loop.

---

# 73. Launch Narrative

Do not lead with cryptography.

Do not lead with:

```text
ZK
Groth16
Merkle trees
Nullifiers
```

Lead with:

> **Your portfolio shouldn't be public.**

Then:

```text
Shield assets.
Build a private portfolio.
Trade through private execution waves.
Withdraw on your terms.
```

Technical proof comes after product understanding.

---

# 74. Example Product Copy

Working launch copy:

```text
Your portfolio shouldn't be public.

Introducing [NAME].

A private market layer built for Robinhood Chain.

Shield assets.
Build a private portfolio.
Trade through execution waves.
Withdraw through privacy-aware waves.

Your assets.
Your positions.
Your business.
```

Trade Wave explanation:

```text
Introducing Trade Waves.

Private trade intents accumulate into scheduled execution windows instead of exposing every user's trade as an individual public action.

More participants.
Less individual metadata.
Shared execution.
Public settlement proof.
```

Exact privacy wording must be reviewed against the production implementation.

---

# 75. Decisions Already Locked

```text
CHAIN
Robinhood Chain

PROJECT NAME
TBD

REFERENCE MODEL
Shared shielded private-balance architecture

PRIMARY DIFFERENTIATOR
Trade Waves

ROBINHOOD-NATIVE DIRECTION
Private Stock Token portfolios

SMART CONTRACTS
Solidity

FRONTEND
Next.js + TypeScript

ADMIN
Multisig

CRYPTOGRAPHY
Use mature ZK tooling
Do not invent a new proof system

RELAYER
Non-custodial

CORE TRUST GOAL
Relayer / operator cannot steal user funds
```

---

# 76. Decisions Still TBD

```text
Project name
Brand identity
Exact ZK stack
Commitment scheme
Merkle tree implementation
Client vs remote proving
Viewing-key model
Recovery model
Relayer architecture
Relayer decentralization
Withdrawal wave interval
Trade wave interval
Execution venue
Internal crossing model
Supported Stock Tokens
Stable asset
Fee model
Deposit screening
Withdrawal screening
Jurisdiction controls
Upgrade model
Escape hatch
Token / no token
Privacy Score
```

Developer should document proposals before making irreversible architecture choices.

---

# 77. Required Developer Deliverables Before Production ZK

## A. `PRIVACY_THREAT_MODEL.md`

Explain:

```text
what is public
what is private
who can see what
what must be trusted
what happens if each service fails
```

## B. `ZK_STACK_DECISION.md`

Compare at least:

```text
Noir / Barretenberg
Circom / Groth16
one additional mature option
```

Score:

```text
EVM cost
browser proving
developer experience
audit maturity
performance
trusted setup
```

## C. `TRADE_WAVE_ARCHITECTURE.md`

Explain:

```text
intent format
encryption
aggregation
netting
execution venue
slippage
partial fills
settlement
failure recovery
```

## D. `ROBINHOOD_ASSET_MATRIX.md`

For each candidate asset:

```text
asset
contract address
decimals
oracle
liquidity venue
Stock Token multiplier behavior
status
```

All addresses must be verified from official sources.

---

# 78. Final Architecture Summary

```text
                    PUBLIC WALLET
                         │
                         │ SIGN
                         ▼
                  PRIVATE ACCOUNT
                         │
                         │ DEPOSIT
                         ▼
                ┌─────────────────┐
                │ SHIELDED POOL   │
                └─────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
      PRIVATE SEND  PRIVATE TRADE  WITHDRAW
                         │             │
                         ▼             ▼
                    TRADE WAVE    WITHDRAWAL WAVE
                         │             │
                         ▼             ▼
                  EXECUTION VENUE    RELAYER
                         │             │
                         └──────┬──────┘
                                ▼
                        ROBINHOOD CHAIN
                                │
                                ▼
                        PUBLIC SETTLEMENT
                                +
                          PRIVATE OWNERSHIP
```

---

# 79. Final Product Definition

> **A shielded private-market layer for Robinhood Chain where users can maintain private balances, transfer privately, withdraw through privacy-aware waves, and eventually build and rebalance Stock Token portfolios through Trade Waves.**

The differentiation is not:

```text
"we also use ZK"
```

It is:

> **Private trading should hide more than the sender wallet. Trade Waves are designed to reduce the individual execution trail itself.**

And the Robinhood-native thesis is:

> **Your portfolio shouldn't be public.**

---

# 80. One-Sentence Rule for Development

> **Copy the proven private-balance primitive, build on mature cryptography, and spend our innovation budget on private market execution rather than inventing new cryptography.**
