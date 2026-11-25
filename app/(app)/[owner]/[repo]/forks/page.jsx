import { GitFork } from "lucide-react";
import { ghPage, getRepo } from "@/lib/github";
import { RepoList } from "@/components/RepoList";
import { Empty, PageTitle, Pager, pageNum } from "@/components/ui/common";

export const metadata = { title: "Fork" };

export default async function Forks({ params, searchParams }) {
  const { owner, repo } = await params;
  const page = pageNum((await searchParams).page);
  const r = await getRepo(owner, repo);
  const { data, next } = await ghPage(`/repos/${r.full_name}/forks?sort=newest&per_page=20&page=${page}`);
  return (
    <div className="mw-900">
      <div className="page-head"><PageTitle icon={GitFork} small>Fork</PageTitle></div>
      {data.length ? <RepoList repos={data} /> : <div className="box"><Empty icon={GitFork} title="Belum ada fork" /></div>}
      <Pager base={`/${r.full_name}/forks`} page={page} hasNext={!!next} />
    </div>
  );
}
