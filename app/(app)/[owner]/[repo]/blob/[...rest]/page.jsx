import Link from "next/link";
import { redirect } from "next/navigation";
import { Code, Download, Eye, FileQuestion, FileText, History, Link2, UserSearch } from "lucide-react";
import { gh, safe, getRefs, getRepo, orNotFound, resolveRef } from "@/lib/github";
import { encPath, fmtBytes, repoUrl, IMAGE_RE, MD_RE } from "@/lib/utils";
import { highlightLines } from "@/lib/highlight";
import Markdown from "@/components/ui/Markdown";
import { Empty } from "@/components/ui/common";
import { BranchSelect } from "@/components/repo/BrowserBits";
import { Crumbs } from "@/components/repo/Browser";
import FileActions from "@/components/repo/FileActions";
import CopyButton from "@/components/ui/CopyButton";
import LineSelect from "@/components/repo/LineSelect";

const MAX_LINES = 5000;
const MAX_BYTES = 1_500_000;

export async function generateMetadata({ params }) {
  const { rest } = await params;
  return { title: decodeURIComponent(rest[rest.length - 1] || "File") };
}

export default async function Blob({ params, searchParams }) {
  const { owner, repo, rest } = await params;
  const sp = await searchParams;
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest, r.default_branch);
  if (!path) redirect(repoUrl(owner, repo, "tree", ref));

  const file = await orNotFound(gh(`/repos/${r.full_name}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`));
  if (Array.isArray(file)) redirect(repoUrl(owner, repo, "tree", ref, path));

  const name = file.name;
  const { branches } = await getRefs(owner, repo);
  const editable = !!r.permissions?.push && branches.includes(ref);
  const rawHref = `/api/raw?repo=${encodeURIComponent(r.full_name)}&ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`;
  const isImage = IMAGE_RE.test(name);

  let text = null, binary = false, tooBig = file.size > MAX_BYTES;
  if (!isImage && !tooBig) {
    let buf = file.encoding === "base64" && file.content ? Buffer.from(file.content, "base64") : null;
    if (!buf) {
      const raw = await gh(`/repos/${r.full_name}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`, { accept: "application/vnd.github.raw+json", text: true });
      buf = Buffer.from(raw, "utf8");
    }
    binary = buf.subarray(0, 8000).includes(0);
    if (!binary) text = buf.toString("utf8");
  }

  const headSha = branches.includes(ref) ? (await safe(gh(`/repos/${r.full_name}/git/ref/heads/${encPath(ref)}`), null))?.object?.sha : null;
  const isMd = MD_RE.test(name) && text !== null;
  const showCode = !isMd || sp.plain === "1";
  const lines = text !== null && showCode ? highlightLines(text, name) : null;
  const shown = lines ? lines.slice(0, MAX_LINES) : null;

  return (
    <div>
      <div className="toolbar">
        <BranchSelect owner={owner} repo={repo} current={ref} kind="blob" path={path} />
        <div className="grow"><Crumbs owner={owner} repo={repo} kind="blob" refName={ref} path={path} /></div>
      </div>
      <div className="box">
        <div className="blob-head">
          {isMd && (
            <span className="btn-group">
              <Link className={`btn btn-sm ${showCode ? "" : "btn-primary"}`} href="?" replace><Eye size={14} className="icon" />Pratinjau</Link>
              <Link className={`btn btn-sm ${showCode ? "btn-primary" : ""}`} href="?plain=1" replace><Code size={14} className="icon" />Kode</Link>
            </span>
          )}
          <span className="muted">{lines ? `${lines.length} baris · ` : ""}{fmtBytes(file.size)}</span>
          <span className="grow" />
          {text !== null && text.length < 100_000 && <CopyButton text={text} label="Salin" />}
          {headSha && <Link className="btn btn-sm" href={repoUrl(owner, repo, "blob", headSha, path)} title="Link permanen ke versi commit ini"><Link2 size={14} className="icon" />Permalink</Link>}
          <Link className="btn btn-sm" href={repoUrl(owner, repo, "commits", ref, path)}><History size={14} className="icon" />Riwayat</Link>
          {text !== null && !isMd && <Link className="btn btn-sm" href={repoUrl(owner, repo, "blame", ref, path)}><UserSearch size={14} className="icon" />Blame</Link>}
          <a className="btn btn-sm" href={rawHref} target="_blank" rel="noopener noreferrer"><FileText size={14} className="icon" />Raw</a>
          <a className="btn btn-sm" href={`${rawHref}&download=1`}><Download size={14} className="icon" />Unduh</a>
          <FileActions owner={owner} repo={repo} refName={ref} path={path} editable={editable} />
        </div>

        {isImage ? (
          <div className="box-body center" style={{ background: "var(--bg-inset)" }}><img src={rawHref} alt={name} style={{ maxHeight: "70vh" }} /></div>
        ) : tooBig || binary ? (
          <Empty icon={FileQuestion} title={tooBig ? "File terlalu besar untuk ditampilkan" : "File biner"}>Gunakan tombol Raw atau Unduh untuk membukanya.</Empty>
        ) : isMd && !showCode ? (
          <div className="box-body" style={{ padding: "24px 32px" }}><Markdown ctx={{ owner, repo, ref, dir: path.split("/").slice(0, -1).join("/") }}>{text}</Markdown></div>
        ) : (
          <div className="code code-scroll">
            <LineSelect />
            <table><tbody>
              {shown.map((html, i) => (
                <tr key={i} id={`L${i + 1}`}>
                  <td className="ln"><a href={`#L${i + 1}`} aria-label={`Baris ${i + 1}`}>{i + 1}</a></td>
                  <td className="src" dangerouslySetInnerHTML={{ __html: html || " " }} />
                </tr>
              ))}
            </tbody></table>
            {lines.length > MAX_LINES && <div className="box-body muted">Menampilkan {MAX_LINES} baris pertama dari {lines.length}. Buka Raw untuk sisanya.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
