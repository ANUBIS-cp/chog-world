"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface WalletContextType {
  address: string | null;
  hasWallet: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  hasWallet: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

function getEth() {
  return typeof window !== "undefined" ? (window as any).ethereum : null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    // Check for wallet immediately and on interval (some wallets inject late)
    const checkWallet = () => {
      const eth = getEth();
      setHasWallet(!!eth);
      if (eth) {
        eth.request({ method: "eth_accounts" })
          .then((accounts: string[]) => accounts[0] && setAddress(accounts[0]))
          .catch(() => {});
      }
    };
    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    const handler = (accounts: string[]) => setAddress(accounts[0] || null);
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, [hasWallet]);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) { 
      window.alert("No wallet detected.\n\nPlease install Rabby or MetaMask extension and refresh the page."); 
      return; 
    }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x279F" }] });
      } catch (e: any) {
        if (e.code === 4902) {
          await eth.request({ method: "wallet_addEthereumChain", params: [{
            chainId: "0x279F", chainName: "Monad Testnet",
            nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
            rpcUrls: ["https://testnet-rpc.monad.xyz"],
            blockExplorerUrls: ["https://testnet.monadscan.com"],
          }]});
        }
      }
    } catch (e: any) {
      window.alert("Connection failed: " + (e.message || e));
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return (
    <WalletContext.Provider value={{ address, hasWallet, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
