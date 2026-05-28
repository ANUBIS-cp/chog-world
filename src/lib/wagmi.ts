"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143, name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadScan", url: "https://testnet.monadscan.com" } },
});

export const config = getDefaultConfig({
  appName: "Chog World",
  projectId: "e4a1e1f0e1b9a1e1f0e1b9a1", 
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http() },
});
