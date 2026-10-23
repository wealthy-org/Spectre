# Spectre contracts

Foundry project for the Phase A transparent prototype — see the root
[README.md](../README.md) and the
[developer brief](../PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md) for
product context.

## Contracts

- **`src/ShieldedPool.sol`** — deposit/withdraw/transfer ledger. Balances are
  deliberately public right now (`balanceOf` mapping) — this is Phase A, not
  the final privacy design. See the NatSpec at the top of the file.
- **`src/mocks/MockUSDG.sol`** — testnet-only ERC-20 standing in for USDG
  (no real USDG exists on Robinhood Chain testnet). Has an open `faucet()`.

## Deployed addresses — Robinhood Chain Testnet (chain id `46630`)

| Contract | Address |
|---|---|
| `ShieldedPool` | [`0xb7C4EE5b7AD9F888377EF7b495d13Fd0a2dE97b2`](https://explorer.testnet.chain.robinhood.com/address/0xb7C4EE5b7AD9F888377EF7b495d13Fd0a2dE97b2) |
| `MockUSDG` | [`0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36`](https://explorer.testnet.chain.robinhood.com/address/0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36) |

These also live in `src/lib/contracts.ts` on the frontend side — **update
both places after every redeploy**, along with the ABI in
`src/lib/abi/ShieldedPool.ts` (regenerate from `out/ShieldedPool.sol/ShieldedPool.json`).

### RPC note

The "official" `rpc.testnet.chain.robinhood.com` endpoint served an invalid
TLS certificate as of 2026-10 (fails from both `curl` and `cast`). This repo
uses `https://robinhood-sepolia-rpc.publicnode.com` instead — re-check
before relying on either long-term.

## Setup

```bash
cp .env.example .env
# fill in DEPLOYER_PRIVATE_KEY with a TESTNET-ONLY wallet's key, funded via
# the faucet linked at docs.robinhood.com/chain. Never a real-funds key.
```

## Build & test

```bash
forge build
forge test        # 21 tests — deposit/withdraw/transfer, access control,
                   # pause semantics, and the conservation invariant
```

## Deploy

```bash
# simulate first (no --broadcast) to sanity-check gas before spending anything
forge script script/DeployShieldedPool.s.sol --rpc-url robinhood_testnet

# then actually broadcast
forge script script/DeployShieldedPool.s.sol --rpc-url robinhood_testnet --broadcast
```

This deploys a **fresh** `ShieldedPool` + `MockUSDG` pair — any balances
shielded in a previous deployment stay in that old contract (still
withdrawable there, just not visible in the app once the frontend address is
updated). After deploying, update:

1. `src/lib/contracts.ts` — new addresses + `SHIELDED_POOL_DEPLOY_BLOCK`
   (read the lowest `blockNumber` from `broadcast/.../run-latest.json`)
2. `src/lib/abi/ShieldedPool.ts` — if the ABI changed
3. The address table above

## Foundry

Standard Foundry toolchain — `forge build` / `forge test` / `forge fmt` /
`cast <subcommand>`. Docs: https://book.getfoundry.sh/
