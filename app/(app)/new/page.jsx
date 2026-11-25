import { BookPlus } from "lucide-react";
import { gh, safe } from "@/lib/github";
import { requireSession } from "@/lib/session";
import { PageTitle } from "@/components/ui/common";
import NewRepoForm from "./NewRepoForm";

export const metadata = { title: "Repository baru" };

export default async function NewRepo() {
  const s = await requireSession();
  const [orgs, gitignores, licenses] = await Promise.all([
    safe(gh("/user/orgs?per_page=100"), []),
    safe(gh("/gitignore/templates"), []),
    safe(gh("/licenses?per_page=100"), []),
  ]);
  return (
    <div className="container page mw-760">
      <PageTitle icon={BookPlus}>Buat repository baru</PageTitle>
      <p className="page-lead" style={{ borderBottom: "1px solid var(--border-muted)", paddingBottom: 16, marginBottom: 20 }}>Repository berisi semua file proyek, termasuk riwayat revisinya.</p>
      <NewRepoForm user={s.user.login} orgs={orgs.map((o) => o.login)} gitignores={gitignores} licenses={licenses} />
    </div>
  );
}
