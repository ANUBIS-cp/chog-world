"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface TipModalState {
  isOpen: boolean;
  tweet: any;
  creatorWallet: string | null;
  open: (tweet: any, creatorWallet: string | null) => void;
  close: () => void;
}

const TipModalContext = createContext<TipModalState>({
  isOpen: false,
  tweet: null,
  creatorWallet: null,
  open: () => {},
  close: () => {},
});

export function TipModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tweet, setTweet] = useState<any>(null);
  const [creatorWallet, setCreatorWallet] = useState<string | null>(null);

  const open = useCallback((t: any, cw: string | null) => {
    setTweet(t);
    setCreatorWallet(cw);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return React.createElement(
    TipModalContext.Provider,
    { value: { isOpen, tweet, creatorWallet, open, close } },
    children
  );
}

export function useTipModal() {
  return useContext(TipModalContext);
}
