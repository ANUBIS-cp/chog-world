"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
const ctx = createContext({ address: null as string | null, connect: async () => {}, disconnect: () => {} });
export const useWallet = () => useContext(ctx);
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((a: string[]) => a[0] && setAddress(a[0])).catch(() => {});
    const handler = (a: string[]) => setAddress(a[0] || null);
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, []);
  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) return alert("Install MetaMask");
    const a = await eth.request({ method: "eth_requestAccounts" });
    setAddress(a[0]);
  }, []);
  return <ctx.Provider value={{ address, connect, disconnect: () => setAddress(null) }}>{children}</ctx.Provider>;
}
