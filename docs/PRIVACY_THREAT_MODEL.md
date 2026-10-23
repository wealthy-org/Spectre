# Privacy Threat Model

**Status:** draft — Phase 0 required deliverable per developer brief §40, §77A.
Describes the system **as actually deployed** (`ShieldedPool` v2 at
`0xb7C4EE5b7AD9F888377EF7b495d13Fd0a2dE97b2`, Robinhood Chain Testnet), not
an aspirational future state. Update this file every time the contract or
architecture changes — a stale threat model is worse than none.

## 1. What is public right now

Everything. This is Phase A (brief §66), deliberately. Specifically:

- `balanceOf[asset][owner]` is a **public Solidity mapping**. Anyone can
  call it for any address and read exactly what they hold, in any
  supported asset.
- Every `Deposited`, `Withdrawn`, and `Transferred` event is a public log,
  permanently queryable (our own `/app/activity` page does exactly this —
  see `getContractEvents` in `src/app/app/activity/page.tsx`).
- `Transferred(asset, from, to, amount)` directly exposes sender,
  recipient, asset, and amount for every private transfer. There is no
  obfuscation at all yet.
- `totalShielded[asset]` is public (by design — this is fine to stay public
  even after Phase 2, per brief §9).

**Honest summary: today, Spectre provides zero privacy.** It is an
accounting-correctness prototype. Anyone who markets it otherwise before
Phase 2 ships is making a false claim — see brief §70, §73.

## 2. What should become private in Phase 2

Per brief §61:

- Private account owner (which real-world identity controls which
  commitment)
- Private transfer recipient
- Private balance (per asset, per owner)
- Complete portfolio composition
- Individual trade ownership
- Internal transfer graph (who paid whom)

## 3. What stays public even after Phase 2 (by design, not by failure)

Per brief §9, §13, §19, §61 — document these precisely so nobody later
claims a guarantee the architecture never made:

- **Deposit transactions**: asset, amount, sender, timestamp. A deposit is
  an onchain action; it cannot be made invisible, only harder to *link* to
  later activity.
- **Withdrawal transactions**: recipient, asset, amount, timestamp, and
  which pool it came from.
- **Pool-level aggregates**: `totalShielded[asset]`, and once Trade Waves
  exist, aggregate wave input/output (brief §26, §35).
- **Network metadata**: IP address, browser fingerprint, request timing,
  RPC provider logs (brief §41) — ZK proofs say nothing about network
  layer. Nobody should assume Tor-level anonymity from this system alone.

## 4. Who can see what — actor by actor

| Actor | Can see today (Phase A) | Can see after Phase 2 (target) |
|---|---|---|
| **Anyone (public chain reader)** | Everything in §1 | Deposit/withdraw tx metadata (§3) + pool aggregates. Not: who owns what, who sent what to whom. |
| **The relayer** (not yet built) | N/A | Per brief §16: can see that *a* valid action was authorized and can censor it, but must not be able to forge a proof, redirect a withdrawal, or weaken a signed slippage limit. |
| **The prover** (not yet built; client-side vs remote per brief §18) | N/A | If remote: sees the witness data needed to build a proof — potentially balance/trade details, depending on circuit design. **This is the single biggest Phase-2 privacy decision** — client-side proving avoids it entirely at the cost of device performance. |
| **Spectre operator / contract owner** (currently the deployer EOA, `0xb91E…bB5AE`) | Everything in §1, plus: can call `setAssetSupported`, `pause`, `unpause` (Ownable — single key today, **not yet a multisig**, see §7) | Same admin surface; must never gain the ability to forge balances or bypass a user's proof (brief §47 admin matrix: "Forge private balance" / "Create proof without user secret" = **Never**, for anyone) |
| **RPC provider** (currently publicnode/drpc/blockvectra — see `contracts/README.md`) | All submitted transaction contents pre-confirmation, and the submitting IP | Same — ZK proofs don't hide this layer (brief §41) |
| **Frontend (if compromised)** | Nothing beyond what the chain already shows, since there is no backend database (brief §42 — confirmed true today, `src/app/app/activity/page.tsx` reads logs directly, no server) | Same guarantee should hold: no plaintext mapping of wallet↔private-account on any server we control |

## 5. What must be trusted

- **The `ShieldedPool` contract code itself** — not yet audited (brief §7,
  Phase 7 gate). Anyone shielding real value before an audit is accepting
  that risk explicitly.
- **The deployer key** (`DEPLOYER_PRIVATE_KEY`, held locally in
  `contracts/.env`, gitignored) — currently the *sole* owner of the
  contract. A compromised deployer key today could call `pause()` or
  change `setAssetSupported`, but — by construction — **cannot** drain
  user balances, forge a balance, or redirect a withdrawal; `withdraw()`
  and `transfer()` only ever move `msg.sender`'s own recorded balance (see
  `test_withdraw_cannotDrainOtherUsersBalance` in
  `contracts/test/ShieldedPool.t.sol`). This is a safety property worth
  re-verifying after every contract change.
- **Whichever RPC endpoint the frontend uses** — see the RPC cert issue
  noted in `contracts/README.md`. A malicious or compromised RPC can lie
  about chain state shown to the user (classic light-client trust
  problem), though it cannot forge a valid signed transaction.

## 6. What happens if each service fails

| Service | Failure mode | Consequence |
|---|---|---|
| Frontend (Vercel/hosting) goes down | Total | Users can still interact with `ShieldedPool` directly via `cast`/Etherscan-style explorer + their own wallet — no funds are stranded, since there is no custodial backend. This is the "escape hatch" brief §45 asks for; today it already holds because the contract has no backend dependency for withdraw. |
| RPC provider goes down | All three configured providers would need to fail simultaneously | Switch `src/lib/chains.ts` to another RPC; funds unaffected |
| Deployer key is lost | Owner-only functions (`pause`, `unpause`, `setAssetSupported`) become permanently uncallable | User funds remain withdrawable — `withdraw()` has no `onlyOwner` gate and is explicitly never-pausable (brief §48) |
| Deployer key is stolen | Attacker can pause deposits/transfers, or add/remove supported assets | Attacker **cannot** steal existing balances (see §5) — worst case is a denial-of-service on new activity, not a theft. Still a real risk: migrate to a multisig before any non-trivial value is shielded (see §7). |
| Explorer (`explorer.testnet.chain.robinhood.com`) goes down | Cosmetic only | Transaction links in the app break; the chain and contract are unaffected |

## 7. Known gaps in this threat model (do not ship past these silently)

- **Single-key ownership.** `ShieldedPool` is owned by one EOA, not a
  multisig + timelock as brief §46/§47 requires before any real value is at
  stake. This is acceptable for a testnet prototype; it is a blocking issue
  for mainnet.
- **No relayer yet.** All actions above currently go out as `msg.sender`
  directly from the user's own wallet — there is no relayer layer to
  reason about yet. §4's relayer row is aspirational, not current state.
- **No commit-reveal / encrypted intents.** Trade Wave privacy properties
  (brief §33, §34) are entirely unbuilt; `/app/trade` is a static mock.
- **This document has not been reviewed by anyone other than the person
  who wrote the code it describes.** Per brief §7, an independent review is
  a Phase 7 gate before mainnet — treat every claim above as "as far as we
  can tell," not "audited."
