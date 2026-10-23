import { createConfig, http, injected } from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chains";

export const wagmiConfig = createConfig({
  chains: [robinhoodChainTestnet],
  connectors: [injected()],
  transports: {
    [robinhoodChainTestnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
