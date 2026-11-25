import Link from "next/link";
import { Star } from "lucide-react";
import { ghPage, getRepo } from "@/lib/github";
import { Avatar, Empty, PageTitle, Pager, pageNum } from "@/components/ui/common";

export const metadata = { title: "Pemberi bintang" };

export default async function Stargazers({ params, searchParams }) {
  const { owner, repo } = await params;
  const page = pageNum((await searchParams).page);
  const r = await getRepo(owner, repo);
  const { data, next } = await ghPage(`/repos/${r.full_name}/stargazers?per_page=30&page=${page}`);
  return (
    <div className="mw-900">
      <div className="page-head"><PageTitle icon={Star} small>Pemberi bintang</PageTitle></div>
      <div className="box">{!data.length ? <Empty icon={Star} title="Belum ada bintang" /> : data.map((u) => (
        <div className="box-row" key={u.id} style={{ alignItems: "center" }}><Avatar src={u.avatar_url} size={40} /><Link href={`/${u.login}`} className="bold">{u.login}</Link></div>))}</div>
      <Pager base={`/${r.full_name}/stargazers`} page={page} hasNext={!!next} />
    </div>
  );
}
