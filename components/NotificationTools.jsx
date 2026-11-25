"use client";
import { useRouter } from "next/navigation";
import { CheckCheck, Check } from "lucide-react";
import { api } from "@/lib/client";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function MarkAllRead() {
  const router = useRouter();
  const [run, busy] = useAction();
  return <button className="btn btn-sm" disabled={busy} onClick={async () => { const r = await run(() => api("/notifications", { method: "PUT", body: {} }), "Semua ditandai dibaca."); if (r.ok) router.refresh(); }}><BtnIcon busy={busy} icon={CheckCheck} />Tandai semua dibaca</button>;
}
export function MarkDone({ id }) {
  const router = useRouter();
  const [run, busy] = useAction();
  return <button className="btn btn-sm btn-ghost" disabled={busy} aria-label="Tandai selesai" title="Tandai selesai" onClick={async () => { const r = await run(() => api(`/notifications/threads/${id}`, { method: "PATCH", body: {} })); if (r.ok) router.refresh(); }}><BtnIcon busy={busy} icon={Check} /></button>;
}
