"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface WalletState {
  address: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTx: (to: string, value: string) => Promise<string>;
}

const WalletContext = createContext<WalletState>({
  address: null, chainId: null,
  connect: async () => {}, disconnect: () => {},
  sendTx: async () => "",
});

export function useWallet() { return useContext(WalletContext); }

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    // Check if already connected
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      });
      (window as any).ethereum.request({ method: "eth_chainId" }).then((id: string) => {
        setChainId(parseInt(id, 16));
      });
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts[0] || null);
      });
      (window as any).ethereum.on("chainChanged", (id: string) => {
        setChainId(parseInt(id, 16));
      });
    }
  }, []);

  const connect = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) { alert("No wallet found. Install MetaMask or Rabby."); return; }
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      // Switch to Monad testnet
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x279F" }], // 10143 in hex
        });
      } catch (e: any) {
        if (e.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x279F",
              chainName: "Monad Testnet",
              nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
              rpcUrls: ["https://testnet-rpc.monad.xyz"],
              blockExplorerUrls: ["https://testnet.monadscan.com"],
            }],
          });
        }
      }
      setChainId(10143);
    } catch (e) {
      console.error("Connect failed:", e);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const sendTx = useCallback(async (to: string, valueHex: string): Promise<string> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !address) throw new Error("Wallet not connected");
    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to, value: valueHex }],
    });
    return txHash;
  }, [address]);

  return (
    <WalletContext.Provider value={{ address, chainId, connect, disconnect, sendTx }}>
      {children}
    </WalletContext.Provider>
  );
}
