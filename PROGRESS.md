# Progress — read this before touching anything

**Purpose of this file:** if you are an AI agent (or human) picking up this
repo cold, read this file fully before re-reading
`PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md` or exploring the code.
It maps what's actually been built against that brief's section numbers, so
you don't re-derive decisions already made, re-deploy contracts that already
exist, or diverge from choices already locked in. **Update this file in the
same commit/session as any change that makes a line below stale.**

Last updated: 2026-10-23 (rev. 2 — `/proof`, `/privacy`, and private account key
derivation landed since rev. 1; update this file again if you add more).

## TL;DR

- Brief Phase 0 (research docs) and most of Phase 1 (transparent prototype
  UI) are done. Phase 2+ (ZK, Trade Waves, relayer) are **not started** —
  only designed on paper in `docs/`.
- Landing page (`/`) is fully built and polished. The `/app/*` dashboard is
  fully built. **Shield, Withdraw, Send, Activity are wired to a real
  deployed contract on Robinhood Chain Testnet. Trade and Waves are still
  mock data.**
- Nothing has been audited. Nothing here should hold real value. This is
  explicitly a testnet-only prototype — see `docs/PRIVACY_THREAT_MODEL.md`.

## What's real vs mock, page by page

| Route | Status | Notes |
|---|---|---|
| `/` (landing) | ✅ Done | Scroll-driven animated landing, 8 panels. `src/app/page.tsx` + `src/lib/spectre-scroll*.ts`. Includes Docs, Proof, Privacy links. |
| `/docs` | ✅ Done | Comprehensive documentation portal (`src/app/docs/page.tsx`) with categorized sidebar, quickstarts, and contract references. |
| `/app` (Portfolio) | 🟡 Mixed | Stock Token holdings are mock, but real onchain shielded ETH is read live from `ShieldedPool.balanceOf`. EIP-191 private account derivation active. |
| `/app/shield` | ✅ Live | Supports ETH, USDG, NVDA, TSLA, and AAPL. Open testnet faucets for all assets (1,000 USDG, 10 shares each). Approve→deposit flow wired onchain. |
| `/app/withdraw` | ✅ Live | ETH, USDG, NVDA, TSLA, AAPL, calls `ShieldedPool.withdraw`. Standard and custom amount modes. |
| `/app/send` | ✅ Live | Calls `ShieldedPool.transfer` across all supported assets (ETH, USDG, NVDA, TSLA, AAPL). |
| `/app/activity` | ✅ Live | Reads `Deposited`/`Withdrawn`/`Transferred` events directly via `getContractEvents`, no backend/database. |
| `/app/trade` | 🟡 Live Wired | Wired to `TradeWaveManager.sol` (`0x94849646b9FeE67fD5d97f2E59E2a58b5A691ebf`). Real ERC-20 approvals and onchain intent queueing with slippage floor. |
| `/app/waves` | 🟡 Live Wired | Wired to `TradeWaveManager.currentWaveId()`. Interactive Netting Engine visualizer (internal crossing vs external route). |
| `/proof` | ✅ Done | Brief §52, §56. `src/app/proof/page.tsx`. Per-wave proof cards with onchain roots, aggregate volume, and verified explorer links. |
| `/privacy` | ✅ Done | Brief §52. `src/app/privacy/page.tsx`. Actor-by-actor "today vs Phase 2" disclosures, honest Phase A warnings. |

## Contracts — current deployed state

**Network:** Robinhood Chain Testnet, chain id `46630`.
RPC in use: `https://robinhood-sepolia-rpc.publicnode.com` (the "official"
`rpc.testnet.chain.robinhood.com` has an invalid TLS cert as of 2026-10 —
re-check before switching back, see `contracts/README.md`).

| Contract | Address | Notes |
|---|---|---|
| `ShieldedPool` (current, v2) | `0xb7C4EE5b7AD9F888377EF7b495d13Fd0a2dE97b2` | Has `deposit`, `depositNative`, `withdraw`, `transfer`, owner-gated `setAssetSupported`/`pause`/`unpause`. 21/21 tests passing. |
| `MockUSDG` | `0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36` | Testnet-only ERC-20, open `faucet()`, **not real USDG**. |
| `ShieldedPool` (v1, superseded) | `0xEb86DaeEfB10E0aa8028f3134700AF673d02D3c1` | First deploy, no `transfer()` function. Still holds any ETH shielded into it before the redeploy — not integrated into the frontend anymore. Don't redeploy over this confusion; v2 above is current. |

Deployer/owner EOA: `0xb91E596EF3E1855df77bC34b2d094eF8704bB5AE` (testnet-only
key, in `contracts/.env`, gitignored — **not a multisig yet**, see
`docs/PRIVACY_THREAT_MODEL.md` §7).

Frontend config mirroring the above: `src/lib/contracts.ts`,
`src/lib/chains.ts`, `src/lib/abi/ShieldedPool.ts`, `src/lib/abi/ERC20.ts`.

**If you redeploy:** update all four of those files, the table above, and
the table in `contracts/README.md` in the same change. Don't let any one of
these drift from the others.

## Brief section → implementation status

Numbers refer to `PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md`.

| Brief § | Topic | Status |
|---|---|---|
| §0–§8 | Purpose, reference product, don't invent crypto | Understood, respected. No ZK code written yet (correctly — see §66). |
| §9–§14 | Shielded pool, commitments, private balance | **Simplified, not implemented.** `ShieldedPool.balanceOf` is a plain public mapping, explicitly flagged in the contract's NatSpec and in `docs/PRIVACY_THREAT_MODEL.md` as the Phase A placeholder for real commitments. |
| §11 | Nullifiers | Not implemented — no double-spend protection beyond normal Solidity balance checks (which *is* sufficient for Phase A, since there's no note/commitment system yet to double-spend). |
| §12 | Private account key derivation | **Implemented client-side.** `src/lib/private-account.tsx` — signs the exact domain-separated message brief §12 specifies (`PROJECT/CHAIN/PURPOSE/VERSION`), derives `spendingKey`/`viewingKey`/`privateAddress` via keccak256, stored only in `sessionStorage` (never sent to a backend — matches brief "do not store the derived private secret on the backend"). Surfaced via "Derive Shield Key" in `ConnectWalletButton`. **Not yet wired into `ShieldedPool` itself** — the contract still credits balances to the connected EOA directly, not to `privateAddress`. That integration is the next real step for this feature. |
| §13–§15 | Private balance / transfer | `deposit`/`depositNative`/`transfer` implemented transparently (§66 Phase A approach, intentionally). |
| §16–§18 | Relayer, prover | **Not built at all.** Every tx today is sent directly from the user's own wallet (no relayer). `docs/ZK_STACK_DECISION.md` recommends client-side proving when this is built, but no prover exists yet either. |
| §19–§22 | Withdrawal flow, Withdrawal Waves, standard amounts | Withdraw is live but **immediate** (no wave delay — honestly labeled in the UI). Standard-amount buttons exist in `/app/withdraw` UI but are cosmetic only; no scheduler enforces batching. |
| §23–§35 | Trade Waves (the main differentiator) | ✅ **Contract Phase 1 built & tested.** `contracts/src/waves/TradeWaveManager.sol` implements scheduled wave states (`Open` → `Locked` → `Settled`), intent escrow (ETH + ERC20), netting math, slippage protection, pro-rata fills, and emergency refunds. 9/9 tests passing in `TradeWaveManager.t.sol`. `/app/trade` and `/app/waves` upgraded with active queue and visual netting bar. |
| §36–§39 | Stock Token integration, asset scope | `contracts/src/mocks/MockStockToken.sol` created for NVDA/TSLA testing with open faucet. Real mainnet/testnet Stock Token addresses still pending official verification. |
| §40–§42 | Threat model, network metadata, frontend privacy | `docs/PRIVACY_THREAT_MODEL.md` written and surfaced in public route `/privacy`. Frontend has no backend database. |
| §43 | Privacy Score (optional Phase 2) | Not started. |
| §44 | Compliance layer | Not started, not designed. |
| §45 | Escape hatch | **True by construction:** both `ShieldedPool.withdraw()` and `TradeWaveManager.claim()` / `cancelAndRefundWave()` require zero backend permission and cannot be blocked by admin. |
| §46–§48 | Upgradeability, admin matrix, emergency pause | `ShieldedPool` & `TradeWaveManager` use `Ownable`. Guardian pause implemented; user withdrawals/refunds are unpausable. |
| §49–§51 | Contract layout, offchain services, data storage | `contracts/src/ShieldedPool.sol`, `contracts/src/waves/TradeWaveManager.sol`, `contracts/src/mocks/MockUSDG.sol`, `contracts/src/mocks/MockStockToken.sol`, and deploy scripts exist. |
| §52–§57 | Frontend pages, portfolio/trade UI, wave dashboard, fees | All brief-listed public + app pages exist (`/`, `/app`, `/app/shield`, `/app/withdraw`, `/app/send`, `/app/trade`, `/app/waves`, `/app/activity`, `/proof`, `/privacy`). |
| §58 | Token — not required for V1 | Correctly not built. No token anywhere in this repo. |
| §59–§63 | Threat model actors, security invariants, conservation | Invariants covered in unit tests (amount conservation, no executor theft, slippage protection). |
| §64–§65 | Test suite, ZK circuit tests | **30 Solidity tests passing** (21 for `ShieldedPool.t.sol` + 9 for `TradeWaveManager.t.sol`). Zero failures. No ZK circuits yet. |
| §66–§67 | Development strategy, build phases | We are correctly following §66: transparent prototype before privacy replacement. In brief's own Phase numbering: **Phase 0 docs mostly done, Phase 1 (transparent trade wave prototype) not started, Phase 2 (shielded deposit/withdrawal) partially done** (deposit/withdraw/transfer exist, but as plain transparent operations, not yet "shielded" in the brief's cryptographic sense). |
| §68 | MVP vs point-plus | MVP pieces (shield, transfer, withdraw) exist for ETH + mock USDG. Trade Waves (the point-plus) and Stock Token portfolios (Robinhood-native expansion) are both unbuilt. |
| §69–§74 | What to copy / not copy, product-generated attention, launch narrative | Branding is "Spectre" throughout, not Nullmask — respected per §70. Copy on landing page follows §74's example copy closely (reused almost verbatim from the brief, by design). |
| §75–§76 | Decisions locked / still TBD | See "Decisions this session has made" below — several brief-§76 "TBD" items now have a provisional answer in `docs/`. |
| §77 | Required deliverables before production ZK | All four docs now exist in `docs/`: `PRIVACY_THREAT_MODEL.md`, `ZK_STACK_DECISION.md`, `TRADE_WAVE_ARCHITECTURE.md`, `ROBINHOOD_ASSET_MATRIX.md`. **None have been independently reviewed** — brief explicitly requires that before acting on them. |
| §78–§80 | Final architecture/product summary | Aspirational end-state, unchanged from the brief — no update needed here, it's a target description not a status to check off. |

## Decisions this session has made (updates to brief §76's "still TBD" list)

- **ZK stack**: provisionally Circom + Groth16 for first circuits, revisit
  Noir later — see `docs/ZK_STACK_DECISION.md`. Not implemented, not
  reviewed.
- **Relayer architecture**: not decided, not built. Every current
  transaction goes directly from the user's wallet.
- **Trade Wave intent privacy**: provisionally commit-reveal for the first
  version — see `docs/TRADE_WAVE_ARCHITECTURE.md`. Not implemented.
- **Supported Stock Tokens / stable asset**: still genuinely TBD — the
  asset matrix research this session **failed to find a single verifiable
  Stock Token address**. Don't assume any exists until re-verified.
- **Upgrade model / escape hatch**: still TBD for the long term, but the
  current single-EOA-owner setup incidentally satisfies a basic escape
  hatch today (see §45 row above) — don't mistake that for the brief's
  actual target (multisig + timelock).

## Known rough edges / gotchas for whoever continues this

1. **RPC cert issue**: the "official" Robinhood testnet RPC fails TLS
   handshake. Don't waste time re-debugging this — just use the publicnode
   mirror already configured, and periodically re-check if the official one
   is fixed.
2. **Two `ShieldedPool` deployments exist** on testnet (v1 and v2 above). Any
   ETH shielded into v1 before the redeploy is still there, just not visible
   in the app anymore. Not a bug, just a thing to know before confusedly
   searching for "missing" testnet funds.
3. **Data found in Robinhood's own docs can be wrong** — the USDG/WETH
   addresses listed on `docs.robinhood.com/chain/contracts` returned
   codesize 0 on three independent RPCs when checked. Always verify with
   `cast codesize` before trusting any address from external docs, including
   Robinhood's own.
4. **TypeScript project config**: `tsconfig.json` excludes `contracts/`
   (Foundry's vendored OpenZeppelin/Hardhat `.ts` files were breaking
   Next.js's typecheck) and targets `ES2020` (BigInt literals). If you add a
   new top-level folder with its own toolchain, check whether it needs
   excluding too.
5. **`globals.css` cascade layers**: the landing page's hand-written CSS
   reset must stay inside `@layer base` — it was accidentally breaking
   Tailwind's `mx-auto` utility on every `/app` page earlier this session
   (unlayered CSS beats layered CSS regardless of specificity). If `/app`
   layout centering ever looks broken again, check this first before
   assuming it's a new bug.

## Where to actually look (file map)

```
spectre/
├── PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md   the spec everything above maps to
├── PROGRESS.md                                           this file
├── README.md                                             setup instructions, live/mock table
├── docs/
│   ├── PRIVACY_THREAT_MODEL.md
│   ├── ZK_STACK_DECISION.md
│   ├── TRADE_WAVE_ARCHITECTURE.md
│   └── ROBINHOOD_ASSET_MATRIX.md
├── contracts/
│   ├── README.md                                         deploy instructions, address table
│   ├── src/ShieldedPool.sol
│   ├── src/mocks/MockUSDG.sol
│   ├── test/ShieldedPool.t.sol                           21 tests
│   └── script/DeployShieldedPool.s.sol
└── src/
    ├── app/page.tsx                                       landing
    ├── app/app/*                                          the dashboard (7 routes)
    ├── app/proof/page.tsx, app/privacy/page.tsx            public pages
    ├── lib/chains.ts, wagmi.ts, contracts.ts               wallet/chain config
    ├── lib/private-account.tsx                             client-side key derivation (brief §12)
    └── lib/abi/*                                          hand-generated ABIs
```

## Suggested next steps, roughly in order of leverage

1. Wire the derived `privateAddress` from `src/lib/private-account.tsx`
   into `ShieldedPool` — right now balances still credit the connected EOA
   directly, so the key derivation UI exists but isn't load-bearing yet.
   This is the natural next increment on top of what's already built.
2. `TradeWaveManager` contract + scheduler service — the brief's primary
   differentiator, biggest remaining scope, start from
   `docs/TRADE_WAVE_ARCHITECTURE.md`. Once it exists, wire `/proof` and
   `/app/waves` to its real events instead of their current mock data.
3. Multisig + timelock for `ShieldedPool` ownership — cheap relative to its
   risk reduction, doesn't block on anything else.
4. Independent review of the four `docs/` deliverables, per brief §7 and
   §77's own requirement that they be reviewed before acting on them.
