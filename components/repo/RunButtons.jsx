"use client";
import { useRouter } from "next/navigation";
import { RefreshCw, Square } from "lucide-react";
import { api } from "@/lib/client";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export default function RunButtons({ repo, id, active }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const act = async (what, msg) => { const r = await run(() => api(`/repos/${repo}/actions/runs/${id}/${what}`, { method: "POST", body: {} }), msg); if (r.ok) setTimeout(() => router.refresh(), 800); };
  return active
    ? <button className="btn btn-sm" disabled={busy} onClick={() => act("cancel", "Run dibatalkan.")}><BtnIcon busy={busy} icon={Square} />Batalkan</button>
    : <button className="btn btn-sm" disabled={busy} onClick={() => act("rerun", "Run diulang.")}><BtnIcon busy={busy} icon={RefreshCw} />Ulangi</button>;
}
