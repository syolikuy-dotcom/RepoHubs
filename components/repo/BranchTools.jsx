"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function NewBranch({ repo, branches, defaultBranch }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [name, setName] = useState("");
  const [from, setFrom] = useState(defaultBranch);
  const valid = /^(?!\/|.*(\.\.|\/\/|@\{|\\))[^\s~^:?*\[]+(?<![/.])$/.test(name) && !name.endsWith(".lock");
  const create = async (e) => {
    e.preventDefault();
    const r = await run(async () => {
      const ref = await api(`/repos/${repo}/git/ref/heads/${from.split("/").map(encodeURIComponent).join("/")}`);
      return api(`/repos/${repo}/git/refs`, { method: "POST", body: { ref: `refs/heads/${name}`, sha: ref.object.sha } });
    }, `Branch ${name} dibuat.`);
    if (r.ok) { setName(""); router.refresh(); }
  };
  return (
    <form className="toolbar" onSubmit={create}>
      <input className="input" style={{ maxWidth: 260 }} placeholder="nama-branch-baru" aria-label="Nama branch baru" value={name} onChange={(e) => setName(e.target.value.trim())} />
      <select className="select" style={{ width: "auto", maxWidth: 200 }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari branch">{branches.map((b) => <option key={b}>{b}</option>)}</select>
      <button className="btn btn-primary" disabled={busy || !valid}><BtnIcon busy={busy} icon={GitBranch} />Buat branch</button>
    </form>
  );
}

export function DeleteBranch({ repo, name }) {
  const router = useRouter();
  return (
    <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus branch" confirmLabel="Hapus branch"
      message={`Branch ${name} akan dihapus. Commit yang belum di-merge bisa hilang.`}
      onConfirm={async () => { await api(`/repos/${repo}/git/refs/heads/${name.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE" }); router.refresh(); }} />
  );
}
