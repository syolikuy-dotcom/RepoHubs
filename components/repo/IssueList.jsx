import Link from "next/link";
import { Inbox, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { Empty, GhLabel, StateIcon } from "@/components/ui/common";

export default function IssueList({ items, showRepo = false, emptyTitle = "Tidak ada hasil" }) {
  if (!items.length) return <div className="box"><Empty icon={Inbox} title={emptyTitle}>Coba ubah filter atau kata kunci pencarian.</Empty></div>;
  return (
    <div className="box">
      {items.map((i) => {
        const repoName = showRepo ? i.repository_url?.split("/repos/")[1] : null;
        const base = `/${repoName || i.__repo}`;
        const href = `${base}/${i.pull_request ? "pull" : "issues"}/${i.number}`;
        const merged = !!i.pull_request?.merged_at;
        return (
          <div className="box-row" key={i.id} style={{ alignItems: "flex-start" }}>
            <StateIcon issue={{ ...i, draft: i.draft }} />
            <div className="grow">
              <div className="flex wrap gap-2 items-center">
                <Link href={href} className="bold wrap-any fg-link" style={{ fontSize: 16 }}>{i.title}</Link>
                {i.labels?.map((l) => <GhLabel key={l.id} name={l.name} color={l.color} />)}
              </div>
              <div className="muted text-sm mt-1 wrap-any">
                {repoName && <><Link href={`/${repoName}`} className="muted">{repoName}</Link> </>}#{i.number} · {merged ? "merged" : i.state === "closed" ? "ditutup" : "dibuka"} {timeAgo(i.closed_at || i.created_at)} oleh {i.user?.login}
              </div>
            </div>
            {i.comments > 0 && <Link href={href} className="muted flex items-center gap-1 shrink0"><MessageSquare size={14} className="icon" />{i.comments}</Link>}
          </div>
        );
      })}
    </div>
  );
}
