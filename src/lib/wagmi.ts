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
  projectId: "9e8b3e4e5c6d7e8f9a0b1c2d3e4f5a6b",
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http() },
});
