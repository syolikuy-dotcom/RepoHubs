import { redirect } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { Logo } from "@/components/Header";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk" };
const TOKEN_URL = "https://github.com/settings/tokens/new?description=RepoHub&scopes=repo,delete_repo,workflow,gist,notifications,read:org,admin:public_key,admin:repo_hook";

export default async function LoginPage({ searchParams }) {
  const { next: n } = await searchParams;
  const next = typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/";
  if (await getSession()) redirect(next);
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="center mb-3" style={{ display: "grid", justifyItems: "center", gap: 12 }}>
          <Logo />
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Masuk ke RepoHub</h1>
          <p className="page-lead" style={{ margin: 0 }}>Kelola repository, upload folder atau ZIP, dan deploy ke Vercel.</p>
        </div>
        <div className="box"><LoginForm next={next} /></div>
        <div className="box box-body mt-3" style={{ background: "transparent" }}>
          <p style={{ margin: "0 0 8px" }}>Belum punya token? <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="meta">Buat di GitHub<ExternalLink size={13} aria-hidden="true" /></a> (scope sudah terisi).</p>
          <p className="muted text-sm" style={{ margin: 0, display: "flex", gap: 8 }}>
            <ShieldCheck size={16} className="icon" style={{ color: "var(--brand)" }} aria-hidden="true" />
            Token dienkripsi (AES-256-GCM) di cookie httpOnly. Browser dan JavaScript halaman tidak pernah bisa membacanya.
          </p>
        </div>
      </div>
    </main>
  );
}
