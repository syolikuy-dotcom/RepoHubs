import { Download, Tag } from "lucide-react";
import { gh, ghPage, getRefs, getRepo } from "@/lib/github";
import { fmtBytes, timeAgo } from "@/lib/utils";
import Markdown from "@/components/ui/Markdown";
import { Empty, PageTitle, Pager, pageNum } from "@/components/ui/common";
import { DeleteRelease, NewRelease } from "@/components/repo/ReleaseTools";

export const metadata = { title: "Rilis" };

export default async function Releases({ params, searchParams }) {
  const { owner, repo } = await params;
  const page = pageNum((await searchParams).page);
  const r = await getRepo(owner, repo);
  const { data, next } = await ghPage(`/repos/${r.full_name}/releases?per_page=15&page=${page}`);
  const { branches } = await getRefs(owner, repo);
  const canPush = !!r.permissions?.push;
  return (
    <div className="mw-1000">
      <div className="page-head"><PageTitle icon={Tag} small>Rilis</PageTitle>{canPush && branches.length > 0 && <NewRelease repo={r.full_name} branches={branches} defaultBranch={r.default_branch} />}</div>
      {!data.length ? <div className="box"><Empty icon={Tag} title="Belum ada rilis">Rilis menandai versi proyek kamu dan bisa membawa file untuk diunduh.</Empty></div> : data.map((rel) => (
        <div className="box mb-3" key={rel.id}>
          <div className="box-header">
            <Tag size={16} className="icon muted" /><span className="box-title wrap-any">{rel.name || rel.tag_name}</span>
            {rel.draft && <span className="pill warn">Draft</span>}{rel.prerelease && <span className="pill warn">Pre-release</span>}
            <span className="grow" /><span className="muted text-sm">{rel.tag_name} · {timeAgo(rel.published_at || rel.created_at)}</span>
            {canPush && <DeleteRelease repo={r.full_name} id={rel.id} tag={rel.tag_name} />}
          </div>
          <div className="box-body">
            {rel.body ? <Markdown ctx={{ owner, repo, ref: rel.tag_name, dir: "" }}>{rel.body}</Markdown> : <span className="muted">Tanpa catatan rilis.</span>}
            {rel.assets?.length > 0 && <div className="mt-3 scroll-x">{rel.assets.map((a) => (
              <div key={a.id} className="flex items-center gap-2" style={{ padding: "4px 0" }}><Download size={14} className="icon muted" />
                <a className="wrap-any grow" href={a.browser_download_url} rel="noopener noreferrer">{a.name}</a><span className="muted text-sm">{fmtBytes(a.size)}</span></div>))}</div>}
          </div>
        </div>
      ))}
      <Pager base={`/${r.full_name}/releases`} page={page} hasNext={!!next} />
    </div>
  );
}
