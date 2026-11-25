"use client";
import Link from "next/link";
import { useState } from "react";
import { Lock, BookMarked } from "lucide-react";
import { SearchField } from "@/components/ui/common";

export default function RepoFilter({ repos }) {
  const [q, setQ] = useState("");
  const list = repos.filter((r) => r.full_name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SearchField inputClassName="sm" placeholder="Cari repository…" label="Filter repository" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
        {list.map((r) => (
          <li key={r.id}>
            <Link href={`/${r.full_name}`} className="flex items-center gap-2 fg-link" style={{ padding: "4px 0" }}>
              {r.private ? <Lock size={14} className="icon muted" /> : <BookMarked size={14} className="icon muted" />}
              <span className="truncate">{r.full_name}</span>
            </Link>
          </li>
        ))}
        {!list.length && <li className="muted text-sm">Tidak ada yang cocok.</li>}
      </ul>
    </div>
  );
}
