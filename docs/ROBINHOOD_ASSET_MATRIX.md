# Robinhood Asset Matrix

**Status:** draft — Phase 0 research deliverable per developer brief §77D.
**Rule:** every address in this file must be independently verified
on-chain (`cast codesize <addr> --rpc-url ...` returning non-zero, at
minimum) before it is used in any deployment script or frontend config.
Nothing here has been verified enough to wire into the app yet.

## Verified on Robinhood Chain Testnet (chain id `46630`)

| Asset | Address | Decimals | Status | Verified how |
|---|---|---|---|---|
| ETH (native) | `0x0000…0000` | 18 | ✅ Live in `ShieldedPool` | Native asset, no contract |
| Mock USDG (testnet-only) | [`0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36`](https://explorer.testnet.chain.robinhood.com/address/0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36) | 18 | ✅ Live in `ShieldedPool` (our mock, not real USDG) | Deployed by us, `cast call name()/symbol()` confirmed |

## Claimed but failed verification — do not use

| Asset | Claimed address | Source | Why rejected |
|---|---|---|---|
| USDG (real) | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | docs.robinhood.com/chain/contracts (fetched 2026-10) | `cast codesize` returns **0** on three independent RPCs (publicnode, drpc, blockvectra), all confirmed on chain id 46630. No contract code exists at this address. Either the docs page has a placeholder/stale value, or our page-content extraction misread it. **Re-check the page directly in a browser before trusting this address again.** |
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` | Same source | Same failure — codesize 0 on all three RPCs. |

## Stock Tokens — not yet verified

The Stock Tokens & Tokenized ETFs table on `docs.robinhood.com/chain/contracts`
renders client-side (our fetch only saw "Loading tokens…"). Nobody has pulled
real addresses for NVDA, TSLA, AAPL, or any other Stock Token yet.

**Before adding any Stock Token to `ShieldedPool.setAssetSupported`:**

1. Open `docs.robinhood.com/chain/contracts` in an actual browser (not a
   text-only fetch) and copy the address from the rendered table.
2. Verify independently: `cast codesize <addr> --rpc-url robinhood_testnet`
   must return non-zero, on at least one RPC that also confirms chain id
   `46630`.
3. Confirm `decimals()` — brief §37 warns against assuming the usual 18;
   Stock Tokens may use a corporate-action multiplier (brief §38) that is
   *separate* from ERC-20 decimals. Read the multiplier mechanism before
   assuming `balance / 10^decimals` is the economic quantity.
4. Record the oracle / price feed address, if any — none found during this
   research pass.
5. Confirm liquidity venue (which DEX/adapter actually has a market for it)
   before assuming it's tradeable — brief §39 caps V1 scope to a handful of
   liquid assets for exactly this reason.

## V1 scope recommendation (brief §39)

Given the above, a realistic V1 asset list is:

- **ETH** — native, already live.
- **One verified stablecoin** — currently our own `MockUSDG`; swap for the
  real USDG the moment its address is independently verified, not before.
- **Stock Tokens** — do not add any until step 1–5 above are done for each
  one. Start with 1–2 of the most liquid (e.g. a large-cap tech name) rather
  than all five from the product brief's examples.

## Open questions this file does not answer

- Is there a per-asset deposit/withdrawal limit from Robinhood's side?
- Do Stock Tokens have transfer restrictions (allow-list, pausability) that
  would make them behave differently from a plain ERC-20 inside
  `ShieldedPool`?
- Corporate-action multiplier mechanism — exact contract interface, and how
  it should map onto `ShieldedPool`'s plain `balanceOf` mapping (brief §38).
