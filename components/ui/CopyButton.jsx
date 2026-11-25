"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "./Toast";

export default function CopyButton({ text, label = "Salin", className = "btn btn-sm" }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }
    catch { toast("Gagal menyalin ke clipboard.", "error"); }
  };
  return <button type="button" className={className} onClick={copy}>{done ? <Check size={14} className="icon" /> : <Copy size={14} className="icon" />}{done ? "Tersalin" : label}</button>;
}
