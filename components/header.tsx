"use client";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="flex flex-col md:flex-row lg:flex-row items-center justify-between w-full p-4">
      <Link href="/">
        <Image
          className="dark:invert"
          src="/hero.svg"
          alt="DeFi.vn hero"
          width={150}
          height={38}
          priority
        />
      </Link>
      <div className="flex flex-row gap-2">
        <ModeToggle />
        <ConnectButton showBalance={false} />
      </div>
    </header>
  );
}
