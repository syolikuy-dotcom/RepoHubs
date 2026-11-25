"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LogIn } from "lucide-react";
import { post } from "@/lib/client";
import { BtnIcon, Flash } from "@/components/ui/common";

export default function LoginForm({ next, tokenUrl }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await post("/api/auth/login", { token: token.trim() });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <Flash type="error">{error}</Flash>}
      <div className="field">
        <div className="flex items-center between" style={{ marginBottom: 6 }}>
          <label htmlFor="token" style={{ marginBottom: 0 }}>Personal access token</label>
          {tokenUrl && (
            <a href={tokenUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
              Generate token
            </a>
          )}
        </div>
        <div className="input-icon has-end">
          <KeyRound size={15} aria-hidden="true" />
          <input
            id="token"
            className="input mono"
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            placeholder="ghp_… atau github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoFocus
          />
          <button
            type="button"
            className="input-end-btn"
            aria-label={show ? "Sembunyikan token" : "Tampilkan token"}
            title={show ? "Sembunyikan token" : "Tampilkan token"}
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || token.trim().length < 20}>
        <BtnIcon busy={busy} icon={LogIn} />Masuk ke RepoHub
      </button>
    </form>
  );
}
