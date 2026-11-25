import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserSearch } from "lucide-react";
import { gh, getRepo, graphql, resolveRef, safe } from "@/lib/github";
import { encPath, fmtBytes, repoUrl, timeAgo } from "@/lib/utils";
import { highlightLines } from "@/lib/highlight";
import { Avatar, Flash } from "@/components/ui/common";
import { Crumbs } from "@/components/repo/Browser";
import LineSelect from "@/components/repo/LineSelect";

export const metadata = { title: "Blame" };
const MAX_BYTES = 800_000;

export default async function Blame({ params }) {
  const { owner, repo, rest } = await params;
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest, r.default_branch);
  if (!path) redirect(repoUrl(owner, repo, "tree", ref));
  const q = `?ref=${encodeURIComponent(ref)}`;

  const [text, data] = await Promise.all([
    gh(`/repos/${r.full_name}/contents/${encPath(path)}${q}`, { accept: "application/vnd.github.raw+json", text: true }),
    safe(graphql(
      `query($o:String!,$n:String!,$e:String!,$p:String!){repository(owner:$o,name:$n){object(expression:$e){... on Commit{blame(path:$p){ranges{startingLine endingLine commit{oid messageHeadline committedDate author{name user{login avatarUrl}}}}}}}}}`,
      { o: owner, n: repo, e: ref, p: path }), null),
  ]);
  const ranges = data?.repository?.object?.blame?.ranges;
  if (text.length > MAX_BYTES) return <Flash type="warn">File terlalu besar untuk tampilan blame ({fmtBytes(text.length)}).</Flash>;
  if (!ranges) return <Flash type="error">Blame tidak tersedia untuk file ini (file biner, baru, atau API GraphQL menolak). <Link href={repoUrl(owner, repo, "blob", ref, path)}>Kembali ke file</Link></Flash>;

  const lines = highlightLines(text, path.split("/").pop());
  const start = new Map(ranges.map((x) => [x.startingLine, x]));
  return (
    <div>
      <div className="toolbar"><div className="grow"><Crumbs owner={owner} repo={repo} kind="blob" refName={ref} path={path} /></div></div>
      <div className="box">
        <div className="blob-head"><span className="muted meta"><UserSearch size={14} aria-hidden="true" />Blame · {lines.length} baris</span><span className="grow" /><Link className="btn btn-sm" href={repoUrl(owner, repo, "blob", ref, path)}><ArrowLeft size={14} className="icon" />Kembali ke file</Link></div>
        <div className="code code-scroll blame">
          <LineSelect />
          <table><tbody>
            {lines.slice(0, 4000).map((html, i) => {
              const n = i + 1, s = start.get(n);
              const c = s?.commit;
              return (
                <tr key={n} id={`L${n}`} className={s ? "first" : ""}>
                  <td className="bl">{c && (
                    <div className="bl-in">
                      <Avatar src={c.author?.user?.avatarUrl} size={16} />
                      <Link href={`/${r.full_name}/commit/${c.oid}`} className="truncate" title={c.messageHeadline} style={{ color: "var(--fg)", flex: 1 }}>{c.messageHeadline}</Link>
                      <span className="muted shrink0">{timeAgo(c.committedDate)}</span>
                    </div>)}</td>
                  <td className="ln"><a href={`#L${n}`}>{n}</a></td>
                  <td className="src" dangerouslySetInnerHTML={{ __html: html || " " }} />
                </tr>
              );
            })}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
