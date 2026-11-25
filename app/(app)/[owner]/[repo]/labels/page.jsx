import { Tag } from "lucide-react";
import { gh, getRepo } from "@/lib/github";
import { Empty, GhLabel, PageTitle } from "@/components/ui/common";
import { DeleteLabel, NewLabel } from "@/components/repo/LabelTools";

export const metadata = { title: "Label" };

export default async function Labels({ params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  const labels = await gh(`/repos/${r.full_name}/labels?per_page=100`);
  const canPush = !!r.permissions?.push;
  return (
    <div className="mw-900">
      <div className="page-head"><PageTitle icon={Tag} small>Label</PageTitle></div>
      {canPush && <NewLabel repo={r.full_name} />}
      <div className="box"><div className="box-header"><span className="box-title">{labels.length} label</span></div>
        {!labels.length ? <Empty icon={Tag} title="Belum ada label" /> : labels.map((l) => (
          <div className="box-row" key={l.id} style={{ alignItems: "center" }}><div style={{ minWidth: 140 }}><GhLabel name={l.name} color={l.color} /></div><span className="muted grow wrap-any">{l.description}</span>{canPush && <DeleteLabel repo={r.full_name} name={l.name} />}</div>))}</div>
    </div>
  );
}
