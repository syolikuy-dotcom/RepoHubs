"use client";
import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import Markdown from "./Markdown";

export default function MarkdownEditor({ value, onChange, placeholder = "Tulis sesuatu… (Markdown didukung)", rows = 6, id, ctx }) {
  const [tab, setTab] = useState("write");
  return (
    <div className="box">
      <div className="box-header" style={{ padding: "6px 8px", gap: 4 }}>
        <button type="button" className={`btn btn-sm ${tab === "write" ? "" : "btn-ghost"}`} onClick={() => setTab("write")}><Pencil size={14} className="icon" />Tulis</button>
        <button type="button" className={`btn btn-sm ${tab === "preview" ? "" : "btn-ghost"}`} onClick={() => setTab("preview")}><Eye size={14} className="icon" />Pratinjau</button>
      </div>
      {tab === "write" ? (
        <textarea id={id} className="textarea" style={{ border: 0, borderRadius: 0, minHeight: rows * 22 }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <div className="box-body" style={{ minHeight: rows * 22 }}>
          {value.trim() ? <Markdown ctx={ctx} small>{value}</Markdown> : <span className="muted">Tidak ada yang bisa dipratinjau.</span>}
        </div>
      )}
    </div>
  );
}
