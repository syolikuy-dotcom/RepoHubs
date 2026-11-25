"use client";
import Link from "next/link";
import { useState } from "react";
import { BookMarked, Lock, Star } from "lucide-react";
import { SearchField } from "@/components/ui/common";
import { fmtNum, langColor } from "@/lib/utils";

export default function RepoFilter({ repos }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = repos.filter((r) => r.full_name.toLowerCase().includes(needle));
  return (
    <div>
      <SearchField inputClassName="sm" placeholder="Cari repository…" label="Filter repository" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {list.map((r) => (
          <li key={r.id}>
            <Link href={`/${r.full_name}`} className="repo-side-link">
              {r.private ? <Lock size={14} className="icon muted" /> : <BookMarked size={14} className="icon muted" />}
              <span className="truncate grow">{r.full_name}</span>
              {r.language && <span className="lang-dot shrink0" style={{ background: langColor(r.language), marginRight: 0 }} title={r.language} />}
              {r.stargazers_count > 0 && (
                <span className="muted text-sm tabular meta shrink0" style={{ gap: 2 }}>
                  <Star size={11} aria-hidden="true" />{fmtNum(r.stargazers_count)}
                </span>
              )}
            </Link>
          </li>
        ))}
        {!list.length && <li className="muted text-sm" style={{ padding: "8px 0" }}>Tidak ada repository yang cocok.</li>}
      </ul>
    </div>
  );
}
