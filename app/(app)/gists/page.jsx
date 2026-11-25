import { FileCode, Globe, Lock, StickyNote } from "lucide-react";
import { gh } from "@/lib/github";
import { Empty, PageTitle, Pager, one, pageNum } from "@/components/ui/common";
import { DeleteGist, NewGist } from "@/components/GistTools";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Gist" };

export default async function Gists({ searchParams }) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const list = await gh(`/gists?per_page=20&page=${page}`);
  return (
    <div className="container page mw-900">
      <div className="page-head"><PageTitle icon={StickyNote}>Gist saya</PageTitle></div>
      <NewGist open={one(sp.new) === "1"} />
      {!list.length ? <div className="box"><Empty icon={FileCode} title="Belum ada gist">Gist cocok untuk potongan kode dan catatan cepat.</Empty></div> : (
        <div className="box">{list.map((g) => {
          const files = Object.keys(g.files);
          return (
            <div className="box-row" key={g.id} style={{ alignItems: "center" }}>
              <FileCode size={16} className="icon muted" />
              <div className="grow"><a href={g.html_url} target="_blank" rel="noopener noreferrer" className="bold wrap-any">{files[0]}{files.length > 1 ? ` +${files.length - 1}` : ""}</a>
                <div className="muted text-sm wrap-any">{g.description || "Tanpa deskripsi"} · {timeAgo(g.updated_at)}</div></div>
              <span className={`pill ${g.public ? "" : "warn"}`}>{g.public ? <Globe size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}{g.public ? "Public" : "Secret"}</span><DeleteGist id={g.id} />
            </div>);
        })}</div>
      )}
      <Pager base="/gists" page={page} hasNext={list.length === 20} />
    </div>
  );
}
