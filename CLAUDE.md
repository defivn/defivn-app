# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start development server at http://localhost:3000
bun run build    # Production build
bun run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 app (App Router) for DeFi.vn, a Vietnamese DeFi educational platform with wallet integration.

### Provider Stack (app/providers.tsx)
The app wraps components in this order:
1. **ThemeProvider** (next-themes) - Dark/light mode
2. **WagmiProvider** - Ethereum wallet connection
3. **QueryClientProvider** - TanStack Query for async state
4. **RainbowKitProvider** - Wallet connection UI

Currently configured for **Unichain Sepolia** testnet only.

### Key Directories
- `components/ui/` - shadcn/ui components (New York style)
- `components/mdx/` - Custom MDX rendering components
- `components/blockchain/` - Interactive blockchain visualization components
- `lib/constants.ts` - Token addresses and contract addresses for Unichain Sepolia
- `lib/config.ts` - Uniswap V4 SDK swap configuration
- `lib/abis.ts` - Contract ABIs
- `contexts/blockchain-context.tsx` - Simulated blockchain state for educational demos
- `hooks/use-blockchain.ts` - Blockchain simulation logic

### Web3 Integration
- Uses **Wagmi v3** + **viem** for Ethereum interactions
- Uses **RainbowKit v2** for wallet connection UI
- Uniswap V4 SDK for swap functionality

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_RPC_URL_UNICHAIN_SEPOLIA` - RPC URL for Unichain Sepolia

### Path Aliases
`@/*` maps to project root (e.g., `@/components`, `@/lib`, `@/hooks`)
