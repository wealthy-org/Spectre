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

export const TRADE_WAVE_MANAGER_ADDRESS = {
  46630: "0x94849646b9fEE67fd5d97f2e59E2A58B5A691EBf", // Verified EIP-55 checksum
} as const;

export const MOCK_STOCK_TOKENS = {
  NVDA: "0x3Afb237cE8a6310CF6BCF2a5DCb9b72A4e02347A", // Verified EIP-55 checksum
  TSLA: "0xA8699478f7736413ea0FDb139b4f2c520A06847A", // Verified EIP-55 checksum
  AAPL: "0xD6C6F37eE0c54Bb21c4e7Fb261FC4b62DbBa48E5", // Verified EIP-55 checksum
} as const;
