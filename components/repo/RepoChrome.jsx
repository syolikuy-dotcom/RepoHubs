"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, Code, CircleDot, Eye, GitFork, GitPullRequest, Play, Settings, Star } from "lucide-react";
import { api } from "@/lib/client";
import { fmtNum } from "@/lib/utils";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

const SECTION = {
  "": "code", tree: "code", blob: "code", edit: "code", new: "code", upload: "code", commits: "code", commit: "code", branches: "code", releases: "code",
  issues: "issues", pulls: "pulls", pull: "pulls", compare: "pulls", actions: "actions", pulse: "pulse", settings: "settings",
};

export function RepoTabs({ base, issues, pulls, admin }) {
  const path = usePathname();
  const seg = path.slice(base.length).split("/")[1] || "";
  const active = SECTION[seg] || "code";
  const tabs = [
    { id: "code", href: base, label: "Kode", icon: Code },
    { id: "issues", href: `${base}/issues`, label: "Issue", icon: CircleDot, count: issues },
    { id: "pulls", href: `${base}/pulls`, label: "Pull request", icon: GitPullRequest, count: pulls },
    { id: "actions", href: `${base}/actions`, label: "Actions", icon: Play },
    { id: "pulse", href: `${base}/pulse`, label: "Insight", icon: Activity },
    ...(admin ? [{ id: "settings", href: `${base}/settings`, label: "Pengaturan", icon: Settings }] : []),
  ];
  return (
    <nav className="tabnav" aria-label="Repository">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} className={`tab ${active === t.id ? "active" : ""}`} aria-current={active === t.id ? "page" : undefined}>
          <t.icon size={16} className="icon" aria-hidden="true" />{t.label}{t.count > 0 && <span className="counter">{fmtNum(t.count)}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function StarButton({ repo, starred, count }) {
  const [on, setOn] = useState(starred);
  const [n, setN] = useState(count);
  const [run, busy] = useAction();
  const toggle = async () => {
    const next = !on;
    setOn(next); setN((c) => c + (next ? 1 : -1));
    const r = await run(() => api(`/user/starred/${repo}`, { method: next ? "PUT" : "DELETE" }));
    if (!r.ok) { setOn(!next); setN((c) => c + (next ? -1 : 1)); }
  };
  return (
    <button className="btn btn-sm" onClick={toggle} disabled={busy} aria-pressed={on}>
      <Star size={14} className="icon" fill={on ? "var(--attention)" : "none"} style={on ? { color: "var(--attention)" } : undefined} />{on ? "Dibintangi" : "Bintang"}<span className="count">{fmtNum(n)}</span>
    </button>
  );
}

export function ForkButton({ repo, count }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const fork = async () => {
    const r = await run(() => api(`/repos/${repo}/forks`, { method: "POST", body: {} }), "Fork dibuat, sedang disiapkan GitHub…");
    if (r.ok) setTimeout(() => router.push(`/${r.result.full_name}`), 1800);
  };
  return <button className="btn btn-sm" onClick={fork} disabled={busy}><BtnIcon busy={busy} icon={GitFork} />Fork<span className="count">{fmtNum(count)}</span></button>;
}

export function WatchButton({ repo, watching, count }) {
  const [on, setOn] = useState(watching);
  const [n, setN] = useState(count);
  const [run, busy] = useAction();
  const toggle = async () => {
    const next = !on;
    setOn(next); setN((c) => c + (next ? 1 : -1));
    const r = await run(() => next ? api(`/repos/${repo}/subscription`, { method: "PUT", body: { subscribed: true } }) : api(`/repos/${repo}/subscription`, { method: "DELETE" }), next ? "Kamu sekarang memantau repo ini." : "Berhenti memantau.");
    if (!r.ok) { setOn(!next); setN((c) => c + (next ? -1 : 1)); }
  };
  return <button className="btn btn-sm" onClick={toggle} disabled={busy} aria-pressed={on}><Eye size={14} className="icon" />{on ? "Dipantau" : "Pantau"}<span className="count">{fmtNum(n)}</span></button>;
}
