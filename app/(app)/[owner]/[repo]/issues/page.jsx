import Link from "next/link";
import { CircleCheck, CircleDot, Milestone, Plus, Search, Tags } from "lucide-react";
import { gh, getRepo, safe } from "@/lib/github";
import { Pager, SearchField, StateTabs, one, pageNum } from "@/components/ui/common";
import IssueList from "@/components/repo/IssueList";

export const metadata = { title: "Issue" };
const SORTS = { created: "Terbaru", comments: "Komentar terbanyak", updated: "Terakhir diperbarui" };

export default async function Issues({ params, searchParams }) {
  const { owner, repo } = await params;
  const sp = await searchParams;
  const r = await getRepo(owner, repo);
  const state = one(sp.state) === "closed" ? "closed" : "open";
  const text = (one(sp.q) || "").trim().slice(0, 200);
  const label = one(sp.label) || "";
  const sort = SORTS[one(sp.sort)] ? one(sp.sort) : "created";
  const page = pageNum(sp.page);
  const base = `repo:${r.full_name} is:issue`;
  const filter = `${text} ${label ? `label:"${label.replace(/"/g, "")}"` : ""}`.trim();
  const qs = (s) => encodeURIComponent(`${base} is:${s} ${filter}`.trim());

  const [res, other, labels] = await Promise.all([
    gh(`/search/issues?q=${qs(state)}&sort=${sort}&order=desc&per_page=25&page=${page}`),
    safe(gh(`/search/issues?q=${qs(state === "open" ? "closed" : "open")}&per_page=1`), null),
    safe(gh(`/repos/${r.full_name}/labels?per_page=100`), []),
  ]);
  const counts = { [state]: res.total_count, [state === "open" ? "closed" : "open"]: other?.total_count ?? "?" };
  const items = res.items.map((i) => ({ ...i, __repo: r.full_name }));
  const q = (extra) => new URLSearchParams(Object.entries({ q: text, label, sort: sort === "created" ? "" : sort, ...extra }).filter(([, v]) => v)).toString();

  return (
    <div>
      <form className="toolbar" action={`/${r.full_name}/issues`}>
        <input type="hidden" name="state" value={state} />
        <SearchField className="grow" style={{ minWidth: 180 }} name="q" defaultValue={text} placeholder="Cari issue…" label="Cari issue" />
        <select className="select auto" name="label" defaultValue={label} aria-label="Label"><option value="">Semua label</option>{labels.map((l) => <option key={l.id}>{l.name}</option>)}</select>
        <select className="select auto" name="sort" defaultValue={sort} aria-label="Urutkan">{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn"><Search size={14} className="icon" />Cari</button>
        <Link href={`/${r.full_name}/labels`} className="btn"><Tags size={14} className="icon" />Label</Link>
        <Link href={`/${r.full_name}/milestones`} className="btn"><Milestone size={14} className="icon" />Milestone</Link>
        <Link href={`/${r.full_name}/issues/new`} className="btn btn-primary"><Plus size={14} className="icon" />Issue baru</Link>
      </form>
      <div className="box">
        <div className="box-header">
          <StateTabs items={[{ href: `/${r.full_name}/issues?${q({ state: "open" })}`, label: `${counts.open} Terbuka`, icon: CircleDot, active: state === "open" }, { href: `/${r.full_name}/issues?${q({ state: "closed" })}`, label: `${counts.closed} Ditutup`, icon: CircleCheck, active: state === "closed" }]} />
        </div>
        <IssueList items={items} emptyTitle="Tidak ada issue yang cocok" />
      </div>
      <Pager base={`/${r.full_name}/issues`} params={{ state, q: text, label, sort: sort === "created" ? "" : sort }} page={page} hasNext={res.total_count > page * 25} />
    </div>
  );
}
