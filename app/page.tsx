// import Image from "next/image";
import Link from "next/link";
import { Wallet, ArrowRightLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-12 md:gap-16 lg:gap-20 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
        <div className="flex flex-col gap-12 md:col-start-2 p-2 md:p-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl">
            Đây là một ứng dụng xây dựng bởi{" "}
            <span className="underline underline-offset-2 font-bold">
              ZxStim
            </span>{" "}
            cho dự án cộng đồng{" "}
            <span className="text-blue-500 font-bold">DeFi.vn</span> để giúp bạn
            có thể trải nghiệm các giao thức tài chính phi tập trung trên mạng
            lưới blockchain thử nghiệm. Hoàn toàn miễn phí và không có rủi ro.
          </h1>
          <div className="grid grid-cols-2 gap-12">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl">Đọc tài liệu</h2>
              <p className="text-md text-muted-foreground">
                Bách khoa toàn thư về tài chính phi tập trung.{" "}
                <a
                  href="https://www.defi.vn"
                  target="_blank"
                  className="text-md underline underline-offset-2"
                >
                  Nhấn vào đây
                </a>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl">Facebook</h2>
              <a
                href="https://www.facebook.com/defivn"
                target="_blank"
                className="text-md text-muted-foreground"
              >
                @defivn
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl">Youtube</h2>
              <a
                href="https://www.youtube.com/@defivn"
                target="_blank"
                className="text-md text-muted-foreground"
              >
                @defivn
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl">Theo dõi ZxStim</h2>
              <a
                href="https://www.facebook.com/zxstim"
                target="_blank"
                className="text-md text-muted-foreground"
              >
                @zxstim
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/tao-tai-khoan">
          <div className="flex flex-col gap-4 border-2 border-muted-foreground/20 rounded-md p-4 h-full">
            <div className="p-2 bg-muted-foreground/20 rounded-md w-fit">
              <Wallet className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Tạo tài khoản</h2>
            <p className="text-sm text-muted-foreground">
              Trải nghiệm khởi tạo một tài khoản Ethereum để sử dụng trên mạng
              lưới blockchain
            </p>
          </div>
        </Link>
        <Link href="/trao-doi-tai-san-ma-hoa">
          <div className="flex flex-col gap-4 border-2 border-muted-foreground/20 rounded-md p-4 h-full">
            <div className="p-2 bg-muted-foreground/20 rounded-md w-fit">
              <ArrowRightLeft className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Trao đổi tài sản mã hóa</h2>
            <p className="text-sm text-muted-foreground">
              Trải nghiệm sử dụng giao thức giao dịch tài sản mã hoá để trao đổi
              ETH qua USDC và ngược lại
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
