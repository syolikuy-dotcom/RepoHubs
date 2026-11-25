"use client";
import { api, createQueue } from "./client";

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

export function toBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

/** SHA-1 git blob: sha1("blob <len>\0" + bytes). Dipakai untuk deteksi file yang tidak berubah. */
export async function gitBlobSha(bytes) {
  const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const all = new Uint8Array(head.length + bytes.length);
  all.set(head);
  all.set(bytes, head.length);
  const hash = await crypto.subtle.digest("SHA-1", all);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function asText(bytes) {
  if (bytes.length > 200_000) return null;
  try {
    const s = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return s.includes("\0") ? null : s;
  } catch { return null; }
}

export const MAX_FILE_BYTES = 3 * 1024 * 1024; // batas per file lewat proxy serverless

/** Ambil peta path->sha dari tree sebuah branch (untuk deteksi file baru/berubah/sama). */
export async function fetchTreeIndex(repo, branch) {
  try {
    const c = await api(`/repos/${repo}/commits/${encodeURIComponent(branch)}`);
    const t = await api(`/repos/${repo}/git/trees/${c.commit.tree.sha}?recursive=1`);
    return { map: new Map(t.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha])), truncated: !!t.truncated };
  } catch (e) {
    if (e.status === 404 || e.status === 409) return { map: new Map(), truncated: false };
    throw e;
  }
}

/**
 * Satu commit atomik untuk banyak perubahan lewat Git Data API.
 * changes: [{ path, bytes?: Uint8Array, text?: string, remove?: true }]
 * opts: { repo:"owner/name", branch, baseBranch?, message, onProgress?(done,total) }
 * Kalau `branch` belum ada, dibuat dari `baseBranch`. Repo kosong ditangani lewat Contents API.
 */
export async function commitChanges(changes, { repo, branch, baseBranch, message, onProgress }) {
  const total = changes.length;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  // 1. cari HEAD branch target (atau base)
  let parentSha = null;
  const tryRef = async (name) => {
    try { return (await api(`/repos/${repo}/git/ref/heads/${enc(name)}`)).object.sha; }
    catch (e) { if (e.status === 404 || e.status === 409) return null; throw e; }
  };
  parentSha = await tryRef(branch);
  let createBranch = false;
  if (!parentSha && baseBranch && baseBranch !== branch) {
    parentSha = await tryRef(baseBranch);
    createBranch = !!parentSha;
  }

  // 2. repo kosong: commit pertama via Contents API, sisanya lanjut normal
  let queue = [...changes];
  if (!parentSha) {
    const first = queue.findIndex((c) => !c.remove);
    if (first === -1) throw new Error("Repository masih kosong, tidak ada yang bisa dihapus.");
    const [c] = queue.splice(first, 1);
    const bytes = c.bytes || new TextEncoder().encode(c.text ?? "");
    await api(`/repos/${repo}/contents/${enc(c.path)}`, {
      method: "PUT",
      body: { message, content: toBase64(bytes), branch },
    });
    tick();
    parentSha = await tryRef(branch);
    if (!queue.length) return { sha: parentSha, branch };
  }

  const parent = await api(`/repos/${repo}/git/commits/${parentSha}`);
  let baseTree = parent.tree.sha;

  // 3. siapkan entri tree; file biner jadi blob (paralel terbatas), teks kecil inline
  const entries = [];
  const run = createQueue(4);
  await Promise.all(queue.map((c) => run(async () => {
    if (c.remove) {
      entries.push({ path: c.path, mode: "100644", type: "blob", sha: null, size: 60 });
    } else {
      const bytes = c.bytes || new TextEncoder().encode(c.text ?? "");
      if (bytes.length > MAX_FILE_BYTES) throw new Error(`${c.path} lebih dari ${MAX_FILE_BYTES / 1048576}MB (batas upload via serverless).`);
      const text = c.text ?? asText(bytes);
      if (text !== null) {
        entries.push({ path: c.path, mode: "100644", type: "blob", content: text, size: bytes.length + 80 });
      } else {
        const blob = await api(`/repos/${repo}/git/blobs`, { method: "POST", body: { content: toBase64(bytes), encoding: "base64" } });
        entries.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha, size: 120 });
      }
    }
    tick();
  })));

  // 4. buat tree bertahap (batas body ~4MB per request)
  let batch = [];
  let size = 0;
  const flush = async () => {
    if (!batch.length) return;
    const t = await api(`/repos/${repo}/git/trees`, {
      method: "POST",
      body: { base_tree: baseTree, tree: batch.map(({ size: _s, ...e }) => e) },
    });
    baseTree = t.sha;
    batch = []; size = 0;
  };
  for (const e of entries) {
    if (size + e.size > 2_500_000) await flush();
    batch.push(e); size += e.size;
  }
  await flush();

  // 5. commit + update/create ref
  const commit = await api(`/repos/${repo}/git/commits`, { method: "POST", body: { message, tree: baseTree, parents: [parentSha] } });
  if (createBranch) {
    await api(`/repos/${repo}/git/refs`, { method: "POST", body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
  } else {
    await api(`/repos/${repo}/git/refs/heads/${enc(branch)}`, { method: "PATCH", body: { sha: commit.sha } });
  }
  return { sha: commit.sha, branch };
}
