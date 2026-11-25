import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { LogoMark } from "@/components/BrandMark";
import { ThemeToggleButton } from "@/components/HeaderMenus";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk" };
const TOKEN_URL = "https://github.com/settings/tokens/new?description=RepoHub&scopes=repo,delete_repo,workflow,gist,notifications,read:org,admin:public_key,admin:repo_hook";

export default async function LoginPage({ searchParams }) {
  const { next: n } = await searchParams;
  const next = typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/";
  if (await getSession()) redirect(next);
  return (
    <main className="auth-wrap">
      <div className="auth-theme-toggle">
        <ThemeToggleButton />
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          <LogoMark size="lg" />
          <h1>RepoHub</h1>
          <p>Masuk dengan GitHub Personal Access Token untuk mengelola repo dan deploy.</p>
        </div>
        <div className="auth-box">
          <LoginForm next={next} tokenUrl={TOKEN_URL} />
        </div>
        <div className="auth-callout">
          <p style={{ margin: "0 0 10px" }}>
            Belum punya token? <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="bold">Buat token di GitHub</a>
          </p>
          <p className="muted text-sm" style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <ShieldCheck size={16} className="icon" style={{ color: "var(--success)", marginTop: 1 }} aria-hidden="true" />
            <span>Token dienkripsi AES-256-GCM di cookie httpOnly dan tidak pernah terbaca oleh browser.</span>
          </p>
        </div>
        <div className="auth-foot">
          <span>GitHub Workspace</span>
          <span>Vercel Deploy</span>
          <span>AES-256-GCM</span>
        </div>
      </div>
    </main>
  );
}
