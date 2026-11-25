import { CircleCheck, CircleDot, Milestone } from "lucide-react";
import { gh, getRepo } from "@/lib/github";
import { Empty, PageTitle, StateTabs, one } from "@/components/ui/common";
import { CloseMilestone, NewMilestone } from "@/components/repo/LabelTools";
import Link from "next/link";

export const metadata = { title: "Milestone" };

export default async function Milestones({ params, searchParams }) {
  const { owner, repo } = await params;
  const state = one((await searchParams).state) === "closed" ? "closed" : "open";
  const r = await getRepo(owner, repo);
  const list = await gh(`/repos/${r.full_name}/milestones?state=${state}&per_page=50`);
  const canPush = !!r.permissions?.push;
  return (
    <div className="mw-900">
      <div className="page-head"><PageTitle icon={Milestone} small>Milestone</PageTitle></div>
      {canPush && <NewMilestone repo={r.full_name} />}
      <div className="box">
        <div className="box-header"><StateTabs items={[{ href: "?state=open", label: "Terbuka", icon: CircleDot, active: state === "open" }, { href: "?state=closed", label: "Ditutup", icon: CircleCheck, active: state === "closed" }]} /></div>
        {!list.length ? <Empty icon={Milestone} title="Tidak ada milestone" /> : list.map((m) => {
          const total = m.open_issues + m.closed_issues;
          const pct = total ? Math.round((m.closed_issues / total) * 100) : 0;
          return (
            <div className="box-row" key={m.id} style={{ alignItems: "center", flexWrap: "wrap" }}>
              <div className="grow"><Link href={`/${r.full_name}/issues?q=${encodeURIComponent(`milestone:"${m.title}"`)}`} className="bold wrap-any">{m.title}</Link>
                <div className="muted text-sm">{m.due_on ? `Tenggat ${new Date(m.due_on).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : "Tanpa tenggat"} · {m.open_issues} terbuka · {m.closed_issues} selesai</div>
                <div className="progress mt-1" style={{ maxWidth: 360 }}><i style={{ width: `${pct}%` }} /></div></div>
              <span className="muted">{pct}%</span>{canPush && <CloseMilestone repo={r.full_name} number={m.number} state={m.state} />}
            </div>);
        })}
      </div>
    </div>
  );
}
