"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { BtnIcon } from "@/components/ui/common";
import { useAction } from "@/components/ui/useAction";
import { commitChanges } from "@/lib/git-client";
import { encPath, repoUrl } from "@/lib/utils";

export default function FileActions({ owner, repo, refName, path, editable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(`Hapus ${path.split("/").pop()}`);
  const [run, busy] = useAction();
  if (!editable) return null;

  const del = async () => {
    const r = await run(() => commitChanges([{ path, remove: true }], { repo: `${owner}/${repo}`, branch: refName, message: msg || `Hapus ${path}` }), "File dihapus.");
    if (r.ok) { setOpen(false); router.push(repoUrl(owner, repo, "tree", refName, path.split("/").slice(0, -1).join("/"))); router.refresh(); }
  };

  return (
    <>
      <Link className="btn btn-sm" href={`/${owner}/${repo}/edit/${encPath(refName)}/${encPath(path)}`}><Pencil size={14} className="icon" />Edit</Link>
      <button className="btn btn-sm btn-danger" onClick={() => setOpen(true)}><Trash2 size={14} className="icon" />Hapus</button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Hapus file" icon={Trash2} danger
        footer={<><button className="btn" onClick={() => setOpen(false)} disabled={busy}>Batal</button><button className="btn btn-danger" onClick={del} disabled={busy}><BtnIcon busy={busy} icon={Trash2} />Commit penghapusan</button></>}>
        <p style={{ marginTop: 0 }}>Menghapus <code>{path}</code> dari branch <code>{refName}</code>.</p>
        <div className="field" style={{ marginBottom: 0 }}><label htmlFor="del-msg">Pesan commit</label><input id="del-msg" className="input" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
      </Dialog>
    </>
  );
}
