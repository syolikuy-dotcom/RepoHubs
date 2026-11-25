"use client";
import { useRouter } from "next/navigation";
import { House, RefreshCw, TriangleAlert } from "lucide-react";
import { Empty } from "@/components/ui/common";

export default function Error({ error, reset }) {
  const router = useRouter();
  return (
    <div className="container page">
      <Empty icon={TriangleAlert} title="Terjadi masalah">
        {error?.message && !error.digest ? error.message : "Halaman ini gagal dimuat. Kalau token kedaluwarsa, login ulang."}
      </Empty>
      <div className="flex gap-2 justify-center">
        <button className="btn btn-primary" onClick={() => { reset(); router.refresh(); }}><RefreshCw size={14} className="icon" />Coba lagi</button>
        <a className="btn" href="/"><House size={14} className="icon" />Ke beranda</a>
      </div>
    </div>
  );
}
