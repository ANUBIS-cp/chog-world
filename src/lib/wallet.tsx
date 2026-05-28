"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface WalletState {
  address: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTx: (to: string, valueWei: string) => Promise<string>;
}

const WalletContext = createContext<WalletState>({
  address: null, chainId: null,
  connect: async () => {}, disconnect: () => {},
  sendTx: async () => "",
});

export function useWallet() { return useContext(WalletContext); }

function getEth() {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum || null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) setAddress(accounts[0]);
    }).catch(() => {});
    eth.request({ method: "eth_chainId" }).then((id: string) => {
      setChainId(parseInt(id, 16));
    }).catch(() => {});
    eth.on("accountsChanged", (accounts: string[]) => setAddress(accounts[0] || null));
    eth.on("chainChanged", (id: string) => setChainId(parseInt(id, 16)));
  }, []);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) { alert("No wallet found. Install MetaMask or Rabby extension."); return; }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      setAddress(addr);
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
      setChainId(10143);
    } catch (e: any) {
      alert("Connection failed: " + (e.message || e));
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const sendTx = useCallback(async (to: string, valueWei: string): Promise<string> => {
    const eth = getEth();
    if (!eth || !address) throw new Error("Wallet not connected");
    // Convert decimal wei to hex for eth_sendTransaction
    const valueHex = "0x" + BigInt(valueWei).toString(16);
    const txHash = await eth.request({
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
