import Link from "next/link";
import { House, SearchX } from "lucide-react";
import { Empty } from "@/components/ui/common";

export default function NotFound() {
  return (
    <div className="container page">
      <Empty icon={SearchX} title="Tidak ditemukan">Halaman atau repository ini tidak ada, atau token kamu tidak punya akses.</Empty>
      <div className="center"><Link className="btn btn-primary" href="/"><House size={14} className="icon" />Ke beranda</Link></div>
    </div>
  );
}
