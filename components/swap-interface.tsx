"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import {
  ArrowRightLeft,
  ArrowUpDown,
  Check,
  CircleSlash,
  Loader2,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { highlightWalletAddressSections } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useSimulateContract,
  useReadContracts,
  useConnection,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { QUOTER_ABI } from "@/lib/abis";
import {
  QUOTER_CONTRACT_ADDRESS,
  USDC_TOKEN,
  ETH_TOKEN,
  UNIVERSAL_ROUTER_ADDRESS,
  PERMIT2_ADDRESS,
} from "@/lib/constants";
import { UNIVERSAL_ROUTER_ABI, PERMIT2_ABI } from "@/lib/abis";
import { erc20Abi, Address, formatUnits, parseUnits, Hex } from "viem";
import { Skeleton } from "@/components/ui/skeleton";
import { SwapExactInSingle } from "@uniswap/v4-sdk";
import { Actions, V4Planner } from "@uniswap/v4-sdk";
import { CommandType, RoutePlanner } from "@uniswap/universal-router-sdk";
import { TransactionStatus } from "@/components/transaction-status";

// Swap steps: 0 = idle, 1 = ERC20 approve, 2 = Permit2 approve, 3 = swap, 4 = complete
type SwapStep = 0 | 1 | 2 | 3 | 4;

export default function SwapInterface() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const connection = useConnection();

  const [zeroForOne, setZeroForOne] = useState(true);
  const [sellAmount, setSellAmount] = useState("");

  // Fetch balances
  const {
    data: balances,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
  } = useReadContracts({
    contracts: [
      {
        abi: erc20Abi,
        address: USDC_TOKEN.address as Address,
        functionName: "balanceOf",
        chainId: 1301,
        args: [connection?.address as Address],
      },
      {
        abi: erc20Abi,
        address: ETH_TOKEN.address as Address,
        functionName: "balanceOf",
        chainId: 1301,
        args: [connection?.address as Address],
      },
    ],
  });

  // Fetch allowances
  // const {
  //   data: allowances,
  //   isLoading: isAllowancesLoading,
  //   isError: isAllowancesError,
  // } = useReadContracts({
  //   contracts: [
  //     {
  //       abi: erc20Abi,
  //       address: USDC_TOKEN.address as Address,
  //       functionName: "allowance",
  //       chainId: 1301,
  //       args: [connection?.address as Address, UNIVERSAL_ROUTER_ADDRESS],
  //     },
  //     {
  //       abi: erc20Abi,
  //       address: ETH_TOKEN.address as Address,
  //       functionName: "allowance",
  //       chainId: 1301,
  //       args: [connection?.address as Address, UNIVERSAL_ROUTER_ADDRESS],
  //     },
  //   ],
  // });

  // Track current swap step
  const [swapStep, setSwapStep] = useState<SwapStep>(0);

  // Store swap config for use across steps
  const swapConfigRef = useRef<{
    encodedActions: Hex;
    routeCommands: Hex;
    deadline: number;
  } | null>(null);

  // Step 1: ERC20 approve to Permit2
  const {
    data: erc20ApproveHash,
    isPending: isPendingErc20Approve,
    writeContract: writeErc20Approve,
    reset: resetErc20Approve,
  } = useWriteContract();

  const {
    isLoading: isErc20ApproveConfirming,
    isSuccess: isErc20ApproveConfirmed,
    error: errorErc20Approve,
  } = useWaitForTransactionReceipt({
    hash: erc20ApproveHash,
  });

  // Step 2: Permit2 approve to Universal Router
  const {
    data: permit2ApproveHash,
    isPending: isPendingPermit2Approve,
    writeContract: writePermit2Approve,
    reset: resetPermit2Approve,
  } = useWriteContract();

  const {
    isLoading: isPermit2ApproveConfirming,
    isSuccess: isPermit2ApproveConfirmed,
    error: errorPermit2Approve,
  } = useWaitForTransactionReceipt({
    hash: permit2ApproveHash,
  });

  // Step 3: Execute swap
  const {
    data: swapHash,
    isPending: isPendingSwap,
    writeContract: writeSwapContract,
    reset: resetSwap,
  } = useWriteContract();

  const {
    isLoading: isSwapConfirming,
    isSuccess: isSwapConfirmed,
    error: errorSwap,
  } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  const CurrentConfig: SwapExactInSingle = {
    poolKey: {
      currency0: ETH_TOKEN.address,
      currency1: USDC_TOKEN.address,
      fee: 500, // 0.05%
      tickSpacing: 10,
      hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: zeroForOne,
    amountIn: parseUnits(sellAmount || "0", 18).toString(),
    amountOutMinimum: "0",
    hookData: "0x00",
  };

  const form = useForm({
    defaultValues: {
      sellAmount: "",
    },
    onSubmit: async () => {
      const v4Planner = new V4Planner();
      const routePlanner = new RoutePlanner();

      // Set deadline (1 hour from now)
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [CurrentConfig]);
      // When zeroForOne=true: selling currency0, receiving currency1
      // When zeroForOne=false: selling currency1, receiving currency0
      v4Planner.addAction(Actions.SETTLE_ALL, [
        zeroForOne
          ? CurrentConfig.poolKey.currency0
          : CurrentConfig.poolKey.currency1,
        CurrentConfig.amountIn,
      ]);
      v4Planner.addAction(Actions.TAKE_ALL, [
        zeroForOne
          ? CurrentConfig.poolKey.currency1
          : CurrentConfig.poolKey.currency0,
        CurrentConfig.amountOutMinimum,
      ]);

      const encodedActions = v4Planner.finalize();

      routePlanner.addCommand(CommandType.V4_SWAP, [
        v4Planner.actions,
        v4Planner.params,
      ]);

      // Store config for later steps
      swapConfigRef.current = {
        encodedActions: encodedActions as Hex,
        routeCommands: routePlanner.commands as Hex,
        deadline,
      };

      // Reset all previous states
      resetErc20Approve();
      resetPermit2Approve();
      resetSwap();

      // Start step 1: ERC20 approve to Permit2
      setSwapStep(1);
      writeErc20Approve({
        address: zeroForOne
          ? (ETH_TOKEN.address as Address)
          : (USDC_TOKEN.address as Address),
        abi: erc20Abi,
        functionName: "approve",
        args: [PERMIT2_ADDRESS, parseUnits(sellAmount || "0", 18)],
      });
    },
  });

  // Effect: When ERC20 approve is confirmed, proceed to Permit2 approve
  useEffect(() => {
    if (isErc20ApproveConfirmed && swapStep === 1) {
      setSwapStep(2);
      writePermit2Approve({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "approve",
        args: [
          zeroForOne
            ? (ETH_TOKEN.address as Address)
            : (USDC_TOKEN.address as Address),
          UNIVERSAL_ROUTER_ADDRESS,
          parseUnits(sellAmount || "0", 18),
          Math.floor(Date.now() / 1000) + 3600,
        ],
      });
    }
  }, [
    isErc20ApproveConfirmed,
    swapStep,
    zeroForOne,
    sellAmount,
    writePermit2Approve,
  ]);

  // Effect: When Permit2 approve is confirmed, proceed to swap
  useEffect(() => {
    if (isPermit2ApproveConfirmed && swapStep === 2 && swapConfigRef.current) {
      setSwapStep(3);
      const { encodedActions, routeCommands, deadline } = swapConfigRef.current;
      writeSwapContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [routeCommands, [encodedActions], deadline],
      });
    }
  }, [isPermit2ApproveConfirmed, swapStep, writeSwapContract]);

  // Effect: When swap is confirmed, mark as complete
  useEffect(() => {
    if (isSwapConfirmed && swapStep === 3) {
      setSwapStep(4);
    }
  }, [isSwapConfirmed, swapStep]);

  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useSimulateContract({
    abi: QUOTER_ABI,
    address: QUOTER_CONTRACT_ADDRESS,
    chainId: 1301,
    functionName: "quoteExactInputSingle",
    args: [
      {
        poolKey: CurrentConfig.poolKey,
        zeroForOne: zeroForOne,
        exactAmount: parseUnits(sellAmount || "0", 18),
        hookData: CurrentConfig.hookData as Address,
      },
    ],
    query: {
      enabled: !!sellAmount && sellAmount !== "0",
    },
  });

  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
  } = useSimulateContract({
    abi: QUOTER_ABI,
    address: QUOTER_CONTRACT_ADDRESS,
    chainId: 1301,
    functionName: "quoteExactInputSingle",
    args: [
      {
        poolKey: CurrentConfig.poolKey,
        zeroForOne: CurrentConfig.zeroForOne,
        exactAmount: BigInt(parseUnits("1", 18).toString()),
        hookData: CurrentConfig.hookData as Address,
      },
    ],
  });

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-4 border border-muted-foreground/10 rounded-md p-4">
        <h2 className="text-lg text-muted-foreground">Thống kê tài sản</h2>
        <p className="text-sm break-all font-mono">
          {connection?.address &&
            highlightWalletAddressSections(connection.address).map(
              (section, i) => (
                <span key={i} className={section.colorClass}>
                  {section.text}
                </span>
              )
            )}
        </p>
        {isBalancesError && (
          <div className="flex flex-row gap-2 items-center text-white bg-red-500 rounded-md p-2">
            X<p>Lỗi khi lấy số dư tài khoản</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row lg:flex-row gap-2 md:justify-between md:items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/eth.svg"
                alt="ETH"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>Ether</p>
            </div>
            <div className="flex flex-row gap-2">
              {isBalancesLoading ? (
                <Skeleton className="w-10 h-4" />
              ) : (
                <p className="break-all font-mono">
                  {formatUnits(
                    balances?.[1]?.result ?? BigInt(0),
                    ETH_TOKEN.decimals
                  )}
                </p>
              )}
              <p className="text-muted-foreground">ETH</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row lg:flex-row gap-2 md:justify-between md:items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/usdc.svg"
                alt="USDC"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>USD</p>
            </div>
            <div className="flex flex-row gap-2">
              {isBalancesLoading ? (
                <Skeleton className="w-10 h-4" />
              ) : (
                <p className="break-all font-mono">
                  {formatUnits(
                    balances?.[0]?.result ?? BigInt(0),
                    USDC_TOKEN.decimals
                  )}
                </p>
              )}
              <p className="text-muted-foreground">USDC</p>
            </div>
          </div>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-4 border border-muted-foreground/10 rounded-md p-4">
          <div className="flex flex-row gap-2 items-center">
            <ArrowRightLeft className="w-4 h-4" />
            <h2 className="text-lg text-muted-foreground">
              Trao đổi tài sản (Swap)
            </h2>
          </div>
          {/* Sell */}
          <div className="flex flex-col gap-2">
            <h2>Bạn bán</h2>
            <form.Field
              name="sellAmount"
              validators={{
                onChange: (({ value }) => {
                  if (!value) return "Hãy nhập số tài sản cần bán";
                  const amount = parseUnits(value, 18);
                  if (amount <= BigInt(0))
                    return "Số tài sản cần bán phải lớn hơn 0";
                  if (amount > (balances?.[1]?.result ?? BigInt(0)))
                    return "Số tài sản cần bán phải nhỏ hơn số dư tài khoản";
                  return undefined;
                }) as (opts: { value: string }) => string | undefined,
              }}
            >
              {(field) => (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2 justify-between items-center">
                    {isDesktop ? (
                      <input
                        id={field.name as string}
                        name={field.name as string}
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSellAmount(value);
                          field.handleChange(value);
                        }}
                        type="number"
                        placeholder="0"
                        className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <input
                        id={field.name as string}
                        name={field.name as string}
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSellAmount(value);
                          field.handleChange(value);
                        }}
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        placeholder="0"
                        className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    )}
                    <p className="text-lg text-muted-foreground self-end">
                      {zeroForOne ? "ETH" : "USDC"}
                    </p>
                  </div>
                  <FieldInfo field={field as AnyFieldApi} />
                </div>
              )}
            </form.Field>
          </div>
          {/* Switch button */}
          <div className="flex flex-row gap-2 justify-center">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="hover:cursor-pointer"
              onClick={() => {
                setZeroForOne(!zeroForOne);
              }}
            >
              <ArrowUpDown />
            </Button>
          </div>
          {/* Buy */}
          <div className="flex flex-col gap-2">
            {quoteError && (
              <div className="flex flex-row gap-2 items-center text-white bg-red-500 rounded-md p-2">
                X<p>Lỗi khi lấy tỉ giá</p>
              </div>
            )}
            <h2>Bạn nhận</h2>
            <div className="flex flex-row gap-2 justify-between">
              {sellAmount && sellAmount !== "0" && isQuoteLoading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <input
                  id="buyAmount"
                  name="buyAmount"
                  value={
                    quoteData?.result?.[0]
                      ? formatUnits(quoteData?.result?.[0], 18)
                      : "0"
                  }
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  readOnly
                />
              )}
              <p className="text-lg text-muted-foreground self-end">
                {zeroForOne ? "USDC" : "ETH"}
              </p>
            </div>
          </div>
          {/* Exchange rate */}
          <div className="flex flex-row gap-2 justify-end items-center">
            <CircleSlash className="w-4 h-4" />
            <div>
              1 {zeroForOne ? "ETH" : "USDC"} ={" "}
              {isExchangeRateLoading ? (
                <Skeleton className="w-10 h-4" />
              ) : (
                formatUnits(exchangeRateData?.result?.[0] ?? BigInt(0), 18)
              )}{" "}
              {zeroForOne ? "USDC" : "ETH"}
            </div>
          </div>
          {/* Action button */}
          <div>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => {
                const isProcessing = swapStep > 0 && swapStep < 4;
                const isComplete = swapStep === 4;

                const getButtonText = () => {
                  if (swapStep === 1) {
                    if (isPendingErc20Approve) return "Đang chờ ký... (1/3)";
                    if (isErc20ApproveConfirming)
                      return "Đang xác nhận approve... (1/3)";
                  }
                  if (swapStep === 2) {
                    if (isPendingPermit2Approve) return "Đang chờ ký... (2/3)";
                    if (isPermit2ApproveConfirming)
                      return "Đang xác nhận permit... (2/3)";
                  }
                  if (swapStep === 3) {
                    if (isPendingSwap) return "Đang chờ ký... (3/3)";
                    if (isSwapConfirming) return "Đang xác nhận swap... (3/3)";
                  }
                  if (isComplete) return "Trao đổi thành công!";
                  return "Trao đổi";
                };

                return (
                  <Button
                    size="lg"
                    className="hover:cursor-pointer font-bold self-end w-full"
                    type="submit"
                    disabled={
                      !canSubmit || isSubmitting || isProcessing || isComplete
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {getButtonText()}
                      </>
                    ) : isComplete ? (
                      <>
                        <Check className="w-4 h-4" />
                        {getButtonText()}
                      </>
                    ) : (
                      <>{getButtonText()}</>
                    )}
                  </Button>
                );
              }}
            </form.Subscribe>
          </div>
        </div>
      </form>
      {/* Show transaction status for each step */}
      <TransactionStatus
        hash={erc20ApproveHash}
        isPending={isPendingErc20Approve}
        isConfirming={isErc20ApproveConfirming}
        isConfirmed={isErc20ApproveConfirmed}
        error={errorErc20Approve}
        chainId={1301}
        label="Bước 1/3: Trao quyền token"
      />
      <TransactionStatus
        hash={permit2ApproveHash}
        isPending={isPendingPermit2Approve}
        isConfirming={isPermit2ApproveConfirming}
        isConfirmed={isPermit2ApproveConfirmed}
        error={errorPermit2Approve}
        chainId={1301}
        label="Bước 2/3: Giới hạn thời gian"
      />
      <TransactionStatus
        hash={swapHash}
        isPending={isPendingSwap}
        isConfirming={isSwapConfirming}
        isConfirmed={isSwapConfirmed}
        error={errorSwap}
        chainId={1301}
        label="Bước 3/3: Trao đổi"
      />
    </div>
  );
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Hãy nhập số tài sản cần bán</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") === "Hãy nhập số tài sản cần bán"
              ? ""
              : "text-red-500"
          }`}
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : (
        <em className="text-green-500">Ok!</em>
      )}
      {field.state.meta.isValidating ? "Đang xác thực..." : null}
    </>
  );
}
