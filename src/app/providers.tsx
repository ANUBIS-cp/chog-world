"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/wallet";
import { TipModalProvider } from "@/hooks/useTipModal";
import { GlobalTipModal } from "@/components/GlobalTipModal";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TipModalProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#13131A",
                border: "1px solid #252534",
                color: "#F0F0F5",
              },
            }}
          />
          <GlobalTipModal />
    </TipModalProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
