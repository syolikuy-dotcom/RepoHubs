"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { File, Search } from "lucide-react";
import PaletteDialog from "@/components/ui/Palette";
import { api } from "@/lib/client";
import { repoUrl } from "@/lib/utils";

export function GoToFileButton() {
  return <button className="btn" onClick={() => window.dispatchEvent(new Event("rh:filefinder"))}><Search size={14} className="icon" />Cari file <kbd>t</kbd></button>;
}

export default function FileFinder({ owner, repo, defaultBranch }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("rh:filefinder", on);
    return () => window.removeEventListener("rh:filefinder", on);
  }, []);

  useEffect(() => {
    if (!open || files) return;
    // ref mengikuti URL saat ini (/tree/<ref> atau /blob/<ref>), fallback branch default
    const m = location.pathname.match(/\/(?:tree|blob)\/([^/]+)/);
    const ref = m ? decodeURIComponent(m[1]) : defaultBranch;
    api(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`)
      .then((t) => {
        if (t.truncated) setNote("Repo sangat besar, daftar file terpotong.");
        setFiles(t.tree.filter((x) => x.type === "blob").map((x) => ({ id: x.sha + x.path, label: x.path, ref, icon: <File size={16} className="icon muted" /> })));
      })
      .catch(() => setFiles([]));
  }, [open, files, owner, repo, defaultBranch]);

  return <PaletteDialog open={open} onClose={() => setOpen(false)} placeholder={`Cari file di ${repo}…${note ? ` (${note})` : ""}`} items={files || []} loading={open && !files} onPick={(it) => { setOpen(false); router.push(repoUrl(owner, repo, "blob", it.ref, it.label)); }} />;
}
