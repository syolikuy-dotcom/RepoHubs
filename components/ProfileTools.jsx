"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { api } from "@/lib/client";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function FollowButton({ login, following }) {
  const router = useRouter();
  const [on, setOn] = useState(following);
  const [run, busy] = useAction();
  const toggle = async () => {
    const next = !on;
    setOn(next);
    const r = await run(() => api(`/user/following/${login}`, { method: next ? "PUT" : "DELETE" }), next ? `Mengikuti ${login}.` : `Berhenti mengikuti ${login}.`);
    if (!r.ok) setOn(!next); else router.refresh();
  };
  return <button className="btn btn-block" onClick={toggle} disabled={busy} aria-pressed={on}><BtnIcon icon={on ? UserCheck : UserPlus} />{on ? "Mengikuti" : "Ikuti"}</button>;
}
