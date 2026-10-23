// Deployed contract addresses, per chain. Update after every redeploy.
export const SHIELDED_POOL_ADDRESS = {
  46630: "0xb7C4EE5b7AD9F888377EF7b495d13Fd0a2dE97b2", // Robinhood Chain Testnet (v2 — adds transfer())
} as const;

// Block the current ShieldedPool was deployed at — used to bound event log
// scans (Activity page) instead of scanning from genesis.
export const SHIELDED_POOL_DEPLOY_BLOCK = {
  46630: 141296407n,
} as const;

// Testnet-only mock ERC-20 standing in for USDG (no real USDG exists on
// Robinhood Chain testnet). Has an open faucet() — see MockUSDG.sol.
export const MOCK_USDG_ADDRESS = {
  46630: "0x89beD016eFe9B7Ce6e6d2ca675b7b8554489Dd36",
} as const;

export const NATIVE_ASSET = "0x0000000000000000000000000000000000000000" as const;
