// import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <Link href="/swap">Trao đổi tài sản</Link>
        <Link href="/lp">Cung cấp thanh khoản</Link>
      </div>
    </div>
  );
}
