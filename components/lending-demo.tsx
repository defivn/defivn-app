"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { DEFIVN_WALLET_ADDRESS } from "@/lib/constants";
import {
  Vault,
  Check,
  CircleSlash,
  Loader2,
  CircleDashed,
  CreditCard
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { formatUnits, parseUnits } from "viem";
import useDebounce from "@/hooks/use-debounce";

export default function LendingDemo() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [balances, setBalances] = useState({
    eth: "100",
    usdt: "0",
  });

  const EXCHANGE_RATE = 4000;

  const [depositAmount, setDepositAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [originalLtv, setOriginalLtv] = useState("");
  const [ltv, setLtv] = useState("");
  const resetLtv = () => setLtv("");
  const [ltvAfterBorrow, setLtvAfterBorrow] = useState("");
  const [healthFactor, setHealthFactor] = useState("");
  const [healthFactorAfterBorrow, setHealthFactorAfterBorrow] = useState("");
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [lendingIsConfirming, setLendingIsConfirming] = useState(false);
  const [lendingIsSuccess, setLendingIsSuccess] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [borrowingIsConfirming, setBorrowingIsConfirming] = useState(false);
  const [borrowingIsSuccess, setBorrowingIsSuccess] = useState(false);
  const [borrowingCurrentStage, setBorrowingCurrentStage] = useState(0);

  // Lending form
  const form = useForm({
    defaultValues: {
      depositAmount: "",
    },
    onSubmit: ({ value }) => {
      setLendingIsConfirming(true);
      setCurrentStage(1);

      // Stage 1: Signing transaction (0.5s)
      setTimeout(() => setCurrentStage(2), 1000);

      // Stage 2: Sending to node (1s)
      setTimeout(() => setCurrentStage(3), 2000);

      // Stage 3: Creating block (1.5s)
      setTimeout(() => setCurrentStage(4), 3000);

      // Stage 4: Adding to chain (2s)
      setTimeout(() => setCurrentStage(5), 4000);

      // Stage 5: Confirming (2.5s) - Update balances here
      setTimeout(() => {
        setCurrentStage(6);
        setLendingIsConfirming(false);
        setLendingIsSuccess(true);
        // Update balances after all stages complete
        setBalances({
          eth: formatUnits(
            parseUnits("100", 18) - parseUnits(value.depositAmount, 18),
            18
          ),
          usdt: "0"
        });
        setCollateralAmount(value.depositAmount);
        setOriginalLtv(ltv);
      }, 5000);

      setTimeout(() => {
        setLendingIsSuccess(false);
      }, 7000);

      form.reset();
    },
  });

  // Borrow form
  const borrowForm = useForm({
    defaultValues: {
      borrowedAmount: "",
    },

    onSubmit: ({ value }) => {
      setBorrowingIsConfirming(true);
      setBorrowingCurrentStage(1);

      // Stage 1: Signing transaction (0.5s)
      setTimeout(() => setBorrowingCurrentStage(2), 1000);

      // Stage 2: Sending to node (1s)
      setTimeout(() => setBorrowingCurrentStage(3), 2000);

      // Stage 3: Creating block (1.5s)
      setTimeout(() => setBorrowingCurrentStage(4), 3000);

      // Stage 4: Adding to chain (2s)
      setTimeout(() => setBorrowingCurrentStage(5), 4000);

      // Stage 5: Confirming (2.5s) - Update balances here
      setTimeout(() => {
        setBorrowingCurrentStage(6);
        setBorrowingIsConfirming(false);
        setBorrowingIsSuccess(true);
        // Update balances after all stages complete
        setBalances({
          eth: balances.eth, // ETH balance doesn't change when borrowing
          usdt: formatUnits(
            parseUnits(balances.usdt, 18) + parseUnits(value.borrowedAmount, 18),
            18
          )
        });
        setBorrowedAmount(value.borrowedAmount);
        setHealthFactor(healthFactorAfterBorrow);
        setLtv(formatUnits(parseUnits(ltv, 18) - parseUnits(value.borrowedAmount, 18), 18));
      }, 5000);

      setTimeout(() => {
        setBorrowingIsSuccess(false);
      }, 7000);

      borrowForm.reset();
    },
  });

  const { value: debouncedDepositAmount, isLoading } = useDebounce(
    depositAmount,
    500
  );

  useEffect(() => {
    if (!debouncedDepositAmount) {
      resetLtv();
      return;
    }

    try {
      const depositAmount = parseUnits(debouncedDepositAmount, 18);
      const ltv = (depositAmount * BigInt(EXCHANGE_RATE) * BigInt(75)) / BigInt(100);
      setLtv(formatUnits(ltv, 18));
      
      if (borrowedAmount && parseFloat(borrowedAmount) > 0) {
        // Calculate health factor: (Collateral Value × Liquidation Threshold) / Borrowed Amount
        // Collateral Value = depositAmount * EXCHANGE_RATE (in USDT)
        // Liquidation Threshold = 80% = 0.8
        // Health Factor = (Collateral Value × 0.8) / Borrowed Amount
        
        const collateralValueInUsdt = depositAmount * BigInt(EXCHANGE_RATE);
        const liquidationThreshold = BigInt(80); // 80%
        const borrowedAmountInWei = parseUnits(borrowedAmount, 18); // USDT has 6 decimals
        
        // Scale up by 10^18 to preserve precision, then divide
        const SCALE_FACTOR = BigInt(10 ** 18);
        const healthFactorNumerator = collateralValueInUsdt * liquidationThreshold * SCALE_FACTOR;
        const healthFactorDenominator = BigInt(100) * borrowedAmountInWei;
        
        const healthFactorAfterBorrow = healthFactorNumerator / healthFactorDenominator;
        setHealthFactorAfterBorrow(formatUnits(healthFactorAfterBorrow, 18)); // Convert back to decimal
      } else {
        setHealthFactorAfterBorrow("");
      }
      
      if (borrowedAmount === "") {
        setHealthFactor("∞");
      }
    } catch {
      // Handle invalid input
      resetLtv();
      setHealthFactorAfterBorrow("");
    }
  }, [debouncedDepositAmount, borrowedAmount]);

  const { value: debouncedBorrowedAmount, isLoading: isLoadingBorrow } = useDebounce(
    borrowedAmount,
    500
  );

  useEffect(() => {
    if (!debouncedBorrowedAmount || !collateralAmount) {
      setHealthFactorAfterBorrow("");
      return;
    }
    
    try {
      // Calculate ltv after borrow
      const ltvAfterBorrow = formatUnits(parseUnits(originalLtv, 18) - parseUnits(debouncedBorrowedAmount, 18), 18);
      
      // Calculate health factor: (Collateral Value × Liquidation Threshold) / Borrowed Amount
      const collateralAmountInWei = parseUnits(collateralAmount, 18);
      const borrowedAmountInWei = parseUnits(debouncedBorrowedAmount, 18); // USDT has 6 decimals
      
      const collateralValueInUsdt = collateralAmountInWei * BigInt(EXCHANGE_RATE);
      const liquidationThreshold = BigInt(80); // 80%
      
      // Scale up by 10^18 to preserve precision, then divide
      const SCALE_FACTOR = BigInt(10 ** 18);
      const healthFactorNumerator = collateralValueInUsdt * liquidationThreshold * SCALE_FACTOR;
      const healthFactorDenominator = BigInt(100) * borrowedAmountInWei;
      
      const healthFactor = healthFactorNumerator / healthFactorDenominator;

      // Set health factor after borrow
      setHealthFactorAfterBorrow(formatUnits(healthFactor, 18)); // Convert back to decimal

      // Set ltv after borrow
      setLtvAfterBorrow(ltvAfterBorrow);
    } catch {
      // Handle invalid input
      setHealthFactorAfterBorrow("");
    }
  }, [debouncedBorrowedAmount, collateralAmount, originalLtv]);

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex flex-col gap-4 border border-muted-foreground/10 rounded-md p-4">
        <h2 className="text-lg text-muted-foreground">Thống kê tài sản</h2>
        <p className="text-sm">{DEFIVN_WALLET_ADDRESS}</p>
        <div className="flex flex-row gap-2 bg-muted-foreground/10 rounded-md p-2 w-fit">
          <Image
            src="/logo.svg"
            alt="defivnlogo"
            width={24}
            height={24}
            className="rounded-full"
          />
          <p>defivn.eth</p>
        </div>
        <div className="flex flex-col gap-2 max-w-[300px]">
          <div className="flex flex-row gap-2 justify-between items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/eth.svg"
                alt="ETH"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>Ethereum</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>{balances.eth}</p>
              <p className="text-muted-foreground">ETH</p>
            </div>
          </div>
          <div className="flex flex-row gap-2 justify-between items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/usdt.svg"
                alt="USDT"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>Tether</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>{balances.usdt}</p>
              <p className="text-muted-foreground">USDT</p>
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
            <Vault className="w-4 h-4" />
            <h2 className="text-lg text-muted-foreground">
              Thế chấp tài sản
            </h2>
          </div>
          {/* Sell */}
          <div className="flex flex-col gap-2">
            <h2>Bạn muốn thế chấp</h2>
            <form.Field
              name="depositAmount"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? "Hãy nhập số tài sản cần thế chấp"
                    : parseUnits(value, 18) < BigInt(0)
                    ? "Số tài sản cần thế chấp phải lớn hơn 0"
                    : parseUnits(value, 18) > parseUnits(balances.eth, 18)
                    ? "Số tài sản cần bán phải nhỏ hơn số dư tài khoản"
                    : undefined,
              }}
            >
              {(field) => (
                <>
                  <div className="flex flex-row gap-2 justify-between">
                    {isDesktop ? (
                      <input
                        id={field.name}
                        name={field.name}
                        value={depositAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDepositAmount(value);
                          field.handleChange(value);
                        }}
                        type="number"
                        placeholder="0"
                        className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        value={depositAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDepositAmount(value);
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
                      ETH
                    </p>
                  </div>
                  <FieldInfo field={field} />
                </>
              )}
            </form.Field>
          </div>
          {/* Borrow */}
          <div className="flex flex-col gap-2">
            <h2>Hạn mức tín dụng</h2>
            <div className="flex flex-row gap-2 items-center justify-between">
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <input
                  id="ltv"
                  name="ltv"
                  value={ltv}
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  readOnly
                />
              )}
              <p className="text-lg text-muted-foreground self-end">USDT</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2>Hệ số thanh lý</h2>
            <p className="text-sm text-muted-foreground">
              Tài sản của bạn sẽ bị thanh lý nếu hệ số này nhỏ hơn 1.0. Hệ số sẽ hiển thị ∞ nếu bạn chưa vay.
            </p>
            <div className="flex flex-row gap-2 items-center justify-between">
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <input
                  id="healthFactor"
                  name="healthFactor"
                  value={healthFactor}
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  readOnly
                />
              )}
            </div>
          </div>
          {/* Exchange rate */}
          <div className="flex flex-row gap-2 justify-end items-center">
            <CircleSlash className="w-4 h-4" />
            <p>1 ETH = {EXCHANGE_RATE} USDT</p>
          </div>
          {/* Action button */}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                size="lg"
                className="hover:cursor-pointer font-bold self-end w-full"
                type="submit"
                disabled={!canSubmit || isSubmitting || lendingIsConfirming}
              >
                {lendingIsConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang thế chấp...
                  </>
                ) : lendingIsSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Thế chấp thành công!
                  </>
                ) : (
                  <>Thế chấp</>
                )}
              </Button>
            )}
          </form.Subscribe>
          <div className="flex flex-col gap-2">
            <div className={`flex flex-row gap-2 items-center`}>
              {currentStage === 1 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStage > 1 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Dùng private key để tạo ra chữ ký cho giao dịch</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {currentStage === 2 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStage > 2 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Gửi giao dịch đến Node (Nút) của mạng lưới Ethereum</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {currentStage === 3 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStage > 3 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối các giao dịch được khởi tạo</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {currentStage === 4 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStage > 4 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối các giao dịch được thêm vào chuỗi</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {currentStage === 5 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStage > 5 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối vừa thêm vào được xác nhận bởi mạng lưới Ethereum</p>
            </div>
          </div>
        </div>
      </form>
      <div className="flex flex-col gap-4 border border-muted-foreground/10 rounded-md p-4">
        <div className="flex flex-row gap-2 items-center">
          <Vault className="w-4 h-4" />
          <h2 className="text-lg text-muted-foreground">
            Tài sản đang thế chấp
          </h2>
        </div>
        <div className="flex flex-col gap-2 max-w-[300px]">
          <div className="flex flex-row gap-2 justify-between items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/eth.svg"
                alt="ETH"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>Ethereum</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>{collateralAmount}</p>
              <p className="text-muted-foreground">ETH</p>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <CreditCard className="w-4 h-4" />
          <h2 className="text-lg text-muted-foreground">
            Hạn mức tín dụng
          </h2>
        </div>
        <div className="flex flex-col gap-2 max-w-[300px]">
          <div className="flex flex-row gap-2 justify-between items-center">
            <div className="flex flex-row gap-2">
              <Image
                src="/logos/usdt.svg"
                alt="USDT"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p>Tether</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>{ltv}</p>
              <p className="text-muted-foreground">USDT</p>
            </div>
          </div>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          borrowForm.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-4 border border-muted-foreground/10 rounded-md p-4">
          <div className="flex flex-row gap-2 items-center">
            <CreditCard className="w-4 h-4" />
            <h2 className="text-lg text-muted-foreground">
              Vay tài sản
            </h2>
          </div>
          {/* Sell */}
          <div className="flex flex-col gap-2">
            <h2>Bạn muốn vay</h2>
            <borrowForm.Field
              name="borrowedAmount"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? "Hãy nhập số tài sản cần vay"
                    : parseUnits(value, 18) < BigInt(0)
                    ? "Số tài sản cần vay phải lớn hơn 0"
                    : parseUnits(value, 18) > parseUnits(ltv, 18)
                    ? "Số tài sản cần vay phải nhỏ hơn hạn mức tín dụng"
                    : undefined,
              }}
            >
              {(field) => (
                <>
                  <div className="flex flex-row gap-2 justify-between">
                    {isDesktop ? (
                      <input
                        id={field.name}
                        name={field.name}
                        value={borrowedAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBorrowedAmount(value);
                          field.handleChange(value);
                        }}
                        type="number"
                        placeholder="0"
                        className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        value={borrowedAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBorrowedAmount(value);
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
                      USDT
                    </p>
                  </div>
                  <BorrowFieldInfo field={field} />
                </>
              )}
            </borrowForm.Field>
          </div>
          {/* Borrow */}
          <div className="flex flex-col gap-2">
            <h2>Hạn mức tín dụng còn lại</h2>
            <div className="flex flex-row gap-2 items-center justify-between">
              {isLoadingBorrow ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <input
                  id="ltvAfterBorrow"
                  name="ltvAfterBorrow"
                  value={ltvAfterBorrow}
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  readOnly
                />
              )}
              <p className="text-lg text-muted-foreground self-end">USDT</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2>Hệ số thanh lý sau khi vay</h2>
            <p className="text-sm text-muted-foreground">
              Tài sản của bạn sẽ bị thanh lý nếu hệ số này nhỏ hơn 1.0. Hệ số sẽ hiển thị ∞ nếu bạn chưa vay.
            </p>
            <div className="flex flex-row gap-2 items-center justify-between">
              {isLoadingBorrow ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <input
                  id="healthFactorAfterBorrow"
                  name="healthFactorAfterBorrow"
                  value={healthFactorAfterBorrow}
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  readOnly
                />
              )}
            </div>
          </div>
          {/* Exchange rate */}
          <div className="flex flex-row gap-2 justify-end items-center">
            <CircleSlash className="w-4 h-4" />
            <p>1 ETH = {EXCHANGE_RATE} USDT</p>
          </div>
          {/* Action button */}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                size="lg"
                className="hover:cursor-pointer font-bold self-end w-full"
                type="submit"
                disabled={!canSubmit || isSubmitting || borrowingIsConfirming}
              >
                {borrowingIsConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang trao đổi...
                  </>
                ) : borrowingIsSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Vay thành công!
                  </>
                ) : (
                  <>Vay</>
                )}
              </Button>
            )}
          </form.Subscribe>
          <div className="flex flex-col gap-2">
            <div className={`flex flex-row gap-2 items-center`}>
              {borrowingCurrentStage === 1 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : borrowingCurrentStage > 1 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Dùng private key để tạo ra chữ ký cho giao dịch</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {borrowingCurrentStage === 2 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : borrowingCurrentStage > 2 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Gửi giao dịch đến Node (Nút) của mạng lưới Ethereum</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {borrowingCurrentStage === 3 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : borrowingCurrentStage > 3 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối các giao dịch được khởi tạo</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {borrowingCurrentStage === 4 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : borrowingCurrentStage > 4 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối các giao dịch được thêm vào chuỗi</p>
            </div>
            <div className={`flex flex-row gap-2 items-center`}>
              {borrowingCurrentStage === 5 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : borrowingCurrentStage > 5 ? (
                <Check className="w-4 h-4" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
              <p>Khối vừa thêm vào được xác nhận bởi mạng lưới Ethereum</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Hãy nhập số tài sản cần thế chấp</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Hãy nhập số tài sản cần thế chấp"
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

function BorrowFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Hãy nhập số tài sản cần vay</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Hãy nhập số tài sản cần vay"
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
