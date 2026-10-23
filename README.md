# Spectre

**Your portfolio shouldn't be public.**

A private market layer prototype for Robinhood Chain — shield assets, build a
private portfolio, trade through execution waves, withdraw on your terms.
See [`PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md`](./PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md)
for the full product/architecture brief this project implements against.

**Status: Phase A — transparent prototype.** Balances are intentionally
public (`ShieldedPool.balanceOf` is a public mapping) to prove the deposit /
withdraw / transfer accounting before Phase 2 replaces it with commitments,
nullifiers, and ZK proofs. Do not treat this build as privacy-preserving.

## Structure

```
spectre/
├── src/app/              Next.js App Router
│   ├── page.tsx           Public landing page (scroll-driven animation)
│   ├── app/               The private-app shell (nav, wallet connect)
│   │   ├── page.tsx        Portfolio
│   │   ├── shield/         Deposit (ETH + testnet mUSDG)
│   │   ├── trade/          Private trade (mock — no Trade Wave backend yet)
│   │   ├── send/           Private transfer (live — calls ShieldedPool.transfer)
│   │   ├── withdraw/       Withdraw (live — calls ShieldedPool.withdraw)
│   │   ├── waves/          Wave status (mock — no scheduler deployed yet)
│   │   └── activity/       Onchain history, read live from event logs
│   └── globals.css
├── src/lib/
│   ├── chains.ts           Robinhood Chain Testnet (viem chain definition)
│   ├── wagmi.ts            wagmi config (injected connector only, for now)
│   ├── contracts.ts        Deployed addresses per chain — update after redeploy
│   └── abi/                Hand-generated ABIs (ShieldedPool, minimal ERC-20)
└── contracts/              Foundry project — see contracts/README.md
```

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The `/app/*` routes need a browser wallet
(MetaMask or similar) connected to **Robinhood Chain Testnet** (chain id
`46630`) to do anything beyond showing mock data — see
[`contracts/README.md`](./contracts/README.md) for the deployed contract
addresses and how to redeploy.

## What's live vs. mock right now

| Page | Status |
|---|---|
| `/` landing | Static, no wallet needed |
| `/app` Portfolio | Mock Stock Token list + **live** onchain ETH balance |
| `/app/shield` | **Live** — ETH and testnet mUSDG |
| `/app/withdraw` | **Live** — ETH and testnet mUSDG |
| `/app/send` | **Live** — calls `ShieldedPool.transfer` |
| `/app/activity` | **Live** — read from `Deposited`/`Withdrawn`/`Transferred` events |
| `/app/trade` | Mock — Trade Wave netting needs an offchain scheduler (brief Phase 5) |
| `/app/waves` | Mock — same dependency as Trade |

## Known gaps / next steps

- Trade Wave scheduler + `TradeWaveManager` contract (brief §23–§35) — the
  main differentiator, not built yet.
- Stock Token support (NVDA/TSLA/AAPL) — no real Stock Token contracts wired;
  `/app/shield` disables them until that exists.
- Phase 0 research docs now live in [`docs/`](./docs): `PRIVACY_THREAT_MODEL.md`,
  `ZK_STACK_DECISION.md`, `TRADE_WAVE_ARCHITECTURE.md`, `ROBINHOOD_ASSET_MATRIX.md`.
- No ZK layer yet (by design — see brief §8, §66: prove the transparent logic first).
