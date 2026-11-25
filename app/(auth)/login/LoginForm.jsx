"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";
import { post } from "@/lib/client";
import { BtnIcon, Flash } from "@/components/ui/common";

export default function LoginForm({ next }) {
  const router = useRouter();
  const [token, setToken] = useState("");
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
        <label htmlFor="token">Personal access token</label>
        <div className="input-icon">
          <KeyRound size={15} aria-hidden="true" />
          <input id="token" className="input" type="password" autoComplete="off" spellCheck={false} placeholder="ghp_… atau github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || token.trim().length < 20}>
        <BtnIcon busy={busy} icon={LogIn} />Masuk
      </button>
    </form>
  );
}
