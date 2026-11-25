import { Avatar } from "@/components/ui/common";
import Markdown from "@/components/ui/Markdown";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export function CommentBox({ user, date, body, label, ctx, author }) {
  return (
    <div className="comment">
      <Link href={`/${user?.login || "ghost"}`}><Avatar src={user?.avatar_url} size={40} alt={user?.login} /></Link>
      <div className="box">
        <div className="box-header">
          <span><strong>{user?.login || "ghost"}</strong> berkomentar {timeAgo(date)}</span>
          <span className="grow" />
          {label && <span className="pill">{label}</span>}
          {author && !label && <span className="pill">Penulis</span>}
        </div>
        <div className="box-body">{body?.trim() ? <Markdown ctx={ctx}>{body}</Markdown> : <span className="muted">Tidak ada deskripsi.</span>}</div>
      </div>
    </div>
  );
}

export function Thread({ issue, comments, ctx }) {
  return (
    <div className="thread">
      <CommentBox user={issue.user} date={issue.created_at} body={issue.body} ctx={ctx} label={issue.author_association === "OWNER" ? "Pemilik" : undefined} />
      {comments.map((c) => <CommentBox key={c.id} user={c.user} date={c.created_at} body={c.body} ctx={ctx} author={c.user?.login === issue.user?.login} label={c.author_association === "OWNER" ? "Pemilik" : undefined} />)}
    </div>
  );
}
