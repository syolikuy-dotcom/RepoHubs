"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitCommitHorizontal, X } from "lucide-react";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";
import { commitChanges } from "@/lib/git-client";
import { repoUrl } from "@/lib/utils";

export default function FileEditor({ owner, repo, mode, branch, defaultBranch, dir, path, initial, login, canPush }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [name, setName] = useState(mode === "edit" ? path : dir ? `${dir}/` : "");
  const [text, setText] = useState(initial || "");
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState(canPush ? "direct" : "branch");
  const [newBranch, setNewBranch] = useState(`${login}-patch-${Math.floor(Math.random() * 9000 + 1000)}`);

  const clean = name.trim().replace(/^\/+/, "");
  const valid = clean && !clean.endsWith("/") && !clean.split("/").some((s) => s === ".." || s === "." || s === "");
  const renamed = mode === "edit" && clean !== path;
  const defMsg = mode === "new" ? `Buat ${clean.split("/").pop() || "file"}` : renamed ? `Ubah nama ${path.split("/").pop()} menjadi ${clean.split("/").pop()}` : `Perbarui ${clean.split("/").pop()}`;

  const onTab = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target, s = el.selectionStart;
    setText(text.slice(0, s) + "  " + text.slice(el.selectionEnd));
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
  };

  const save = async (e) => {
    e.preventDefault();
    const targetBranch = target === "direct" ? branch : newBranch.trim();
    const changes = [{ path: clean, text }];
    if (renamed) changes.push({ path, remove: true });
    const r = await run(() => commitChanges(changes, { repo: `${owner}/${repo}`, branch: targetBranch, baseBranch: branch, message: msg.trim() || defMsg }), "Perubahan di-commit.");
    if (!r.ok) return;
    router.push(target === "direct" ? repoUrl(owner, repo, "blob", branch, clean) : `/${owner}/${repo}/compare?base=${encodeURIComponent(defaultBranch)}&head=${encodeURIComponent(targetBranch)}`);
    router.refresh();
  };

  return (
    <form onSubmit={save}>
      <div className="field">
        <label htmlFor="fname">Nama file{mode === "new" ? " (gunakan / untuk membuat folder)" : ""}</label>
        <input id="fname" className="input mono" value={name} onChange={(e) => setName(e.target.value)} placeholder="folder/nama-file.txt" required autoFocus={mode === "new"} spellCheck={false} />
        {renamed && <div className="hint">File akan dipindahkan dari <code>{path}</code>.</div>}
      </div>
      <div className="field"><textarea className="textarea code" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onTab} aria-label="Isi file" spellCheck={false} /></div>

      <div className="box box-body">
        <h3 className="section-title"><GitCommitHorizontal size={16} aria-hidden="true" />Commit perubahan</h3>
        <div className="field"><label htmlFor="msg">Pesan commit</label><input id="msg" className="input" placeholder={defMsg} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        <label className="radio-card" style={{ opacity: canPush ? 1 : .5 }}><input type="radio" checked={target === "direct"} disabled={!canPush} onChange={() => setTarget("direct")} /><span>Commit langsung ke branch <code>{branch}</code></span></label>
        <label className="radio-card"><input type="radio" checked={target === "branch"} onChange={() => setTarget("branch")} /><span style={{ flex: 1 }}>Buat branch baru lalu ajukan pull request
          {target === "branch" && <input className="input mono mt-2" aria-label="Nama branch baru" value={newBranch} onChange={(e) => setNewBranch(e.target.value)} />}</span></label>
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary" disabled={busy || !valid || (target === "branch" && !newBranch.trim())}><BtnIcon busy={busy} icon={GitCommitHorizontal} />Commit perubahan</button>
          <button type="button" className="btn" onClick={() => router.back()} disabled={busy}><X size={14} className="icon" />Batal</button>
        </div>
      </div>
    </form>
  );
}
