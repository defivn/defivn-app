import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateHash(hash: string, startLength: number = 6, endLength: number = 4) {
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

export function highlightWalletAddressSections(address: Address) {
  // Standard EVM address: 0x + 40 hex chars = 42 chars total
  // Break into 4 sections of 10 hex chars each (plus 0x prefix on first section)
  const colors = [
    "text-rose-500",      // Section 1: pink/rose
    "text-amber-500",     // Section 2: amber/yellow
    "text-emerald-500",   // Section 3: green
    "text-sky-500",       // Section 4: blue
  ];

  return [
    { text: address.slice(0, 12), colorClass: colors[0] },  // 0x + first 10 hex
    { text: address.slice(12, 22), colorClass: colors[1] }, // next 10 hex
    { text: address.slice(22, 32), colorClass: colors[2] }, // next 10 hex
    { text: address.slice(32, 42), colorClass: colors[3] }, // last 10 hex
  ];
}