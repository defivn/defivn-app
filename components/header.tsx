"use client";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";

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
      <ModeToggle />
    </header>
  );
}
