import SwapInterface from "@/components/swap-interface";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto px-4 pb-12">
      <h1 className="text-xl md:text-3xl lg:text-5xl font-bold">Trao đổi tài sản</h1>
      <Button
        variant="link"
        asChild
        className="hover:cursor-pointer self-start"
      >
        <Link href="/">
          <ChevronLeft /> Quay lại
        </Link>
      </Button>
      <ConnectButton showBalance={false} />
      <SwapInterface />
    </div>
  );
}
