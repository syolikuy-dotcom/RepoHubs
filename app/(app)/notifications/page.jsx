import Link from "next/link";
import { Bell, BellOff, CircleDot, GitCommitHorizontal, GitPullRequest, MessageSquare, Play, ShieldAlert, Tag } from "lucide-react";
import { gh } from "@/lib/github";
import { apiUrlToPath, timeAgo } from "@/lib/utils";
import { Empty, PageTitle } from "@/components/ui/common";
import { MarkAllRead, MarkDone } from "@/components/NotificationTools";

export const metadata = { title: "Notifikasi" };

const KIND = {
  Issue: { icon: CircleDot, label: "Issue" },
  PullRequest: { icon: GitPullRequest, label: "Pull request" },
  Commit: { icon: GitCommitHorizontal, label: "Commit" },
  Release: { icon: Tag, label: "Rilis" },
  Discussion: { icon: MessageSquare, label: "Diskusi" },
  CheckSuite: { icon: Play, label: "Actions" },
  RepositoryVulnerabilityAlert: { icon: ShieldAlert, label: "Keamanan" },
};

export default async function Notifications() {
  const list = await gh("/notifications?per_page=50");
  const groups = {};
  for (const n of list) (groups[n.repository.full_name] ||= []).push(n);
  return (
    <div className="container page mw-900">
      <div className="page-head"><PageTitle icon={Bell}>Notifikasi</PageTitle>{list.length > 0 && <MarkAllRead />}</div>
      {!list.length ? <div className="box"><Empty icon={BellOff} title="Semua sudah dibaca">Tidak ada notifikasi baru.</Empty></div> : Object.entries(groups).map(([name, items]) => (
        <div className="box mb-3" key={name}>
          <div className="box-header"><Link href={`/${name}`} className="box-title">{name}</Link></div>
          {items.map((n) => {
            const k = KIND[n.subject.type] || { icon: Bell, label: n.subject.type };
            return (
              <div className="box-row" key={n.id} style={{ alignItems: "center" }}>
                <span className="pill"><k.icon size={12} aria-hidden="true" />{k.label}</span>
                <Link href={apiUrlToPath(n.subject.url)} className="grow wrap-any fg-link">{n.subject.title}</Link>
                <span className="muted text-sm shrink0">{timeAgo(n.updated_at)}</span><MarkDone id={n.id} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
