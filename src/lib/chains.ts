import { defineChain } from "viem";

// Robinhood Chain Testnet — an Arbitrum Orbit L2 settling to Ethereum.
// Verified against chainid.network/chain/46630 and docs.robinhood.com/chain
// (2026-10). Re-verify before mainnet: these are testnet-only values.
export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    // The "official" rpc.testnet.chain.robinhood.com endpoint currently
    // serves an invalid TLS certificate (verified 2026-10, fails from both
    // curl and cast) — using the publicnode mirror until that's fixed.
    // Re-check before relying on this long-term.
    default: { http: ["https://robinhood-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});
