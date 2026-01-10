"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { trustWallet, ledgerWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { unichainSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { ThemeProvider } from "@/components/theme-provider";

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
  appName: "DeFi.vn App", // Name your app
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, // Enter your WalletConnect Project ID here
  wallets: [
    {
      groupName: "Installed",
      wallets: [injectedWallet],
    },
    ...wallets,
    {
      groupName: "Other",
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [unichainSepolia],
  transports: {
    [unichainSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_UNICHAIN_SEPOLIA!),
  },
  ssr: true, // Because it is Nextjs's App router, you need to declare ssr as true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
