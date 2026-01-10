

import { BaseError } from "viem";
import { Hash, ExternalLink, Ban, LoaderCircle, CircleCheck, X } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { truncateHash } from "@/lib/utils";
import { useConfig } from "wagmi";

interface TransactionStatusProps {
  hash?: string;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  error?: Error | null;
  chainId?: number;
  label?: string;
}

export function TransactionStatus({
  hash,
  isPending,
  isConfirming,
  isConfirmed = false,
  error,
  chainId,
  label,
}: TransactionStatusProps) {
  const config = useConfig();
  return (
    <div className="flex flex-col gap-2 border border-muted-foreground/10 rounded-md p-3">
      {label && (
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      )}
      {hash && (isConfirmed || isConfirming) ? (
        <div className="flex flex-row gap-2 items-center">
          <Hash className="w-4 h-4" />
          Mã giao dịch
          <a
            className="flex flex-row gap-2 items-center underline underline-offset-4"
            href={`${config.chains?.find(chain => chain.id === chainId)?.blockExplorers?.default?.url || config.chains?.[0]?.blockExplorers?.default?.url}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHash(hash)}
            <ExternalLink className="w-4 h-4" />
          </a>
          <CopyButton text={hash || ""} />
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <Hash className="w-4 h-4" />
          Không có mã giao dịch
        </div>
      )}

      {!isPending && !isConfirmed && !isConfirming && (
        <div className="flex flex-row gap-2 items-center">
          <Ban className="w-4 h-4" /> Không có mã giao dịch
        </div>
      )}

      {isConfirming && (
        <div className="flex flex-row gap-2 items-center text-yellow-500">
          <LoaderCircle className="w-4 h-4 animate-spin" /> Chờ xác nhận...
        </div>
      )}

      {hash && isConfirmed && !isPending && !isConfirming && (
        <div className="flex flex-row gap-2 items-center text-green-500">
          <CircleCheck className="w-4 h-4" /> Đã xác nhận!
        </div>
      )}

      {error && (
        <div className="flex flex-row gap-2 items-center text-red-500">
          <X className="w-4 h-4" /> Lỗi: {(error as BaseError).shortMessage || error.message}
        </div>
      )}
    </div>
  );
}
