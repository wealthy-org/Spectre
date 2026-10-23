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
  46630: "0xB7a32FBF021A49e7601669c82F835959daC6Ab69", // Deployed TradeWaveManager onchain
} as const;

export const WITHDRAW_VERIFIER_ADDRESS = {
  46630: "0x9D9C9Bff3fb5A2F3dc30D8013428Fe4376eaF915", // Groth16 ZK Verifier
} as const;

export const MOCK_STOCK_TOKENS = {
  NVDA: "0x0808d14583f380C0Dc4703465e9eCb2C7d2B2549", // Deployed MockNVDA onchain
  TSLA: "0xb6601EB39A42f54ebE1889630be21b9251d485B7", // Deployed MockTSLA onchain
  AAPL: "0xD6C6F37eE0c54Bb21c4e7Fb261FC4b62DbBa48E5", // Verified EIP-55 checksum
} as const;



