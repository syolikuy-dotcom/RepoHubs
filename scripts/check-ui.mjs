#!/usr/bin/env node
/**
 * Pemeriksa aturan UI RepoHub (jalankan: npm run check:ui)
 *  1. Tidak boleh ada emoji / simbol piktograf / glyph panah dan bintang di kode UI.
 *  2. Tidak boleh ada <svg> inline di komponen (semua ikon dari lucide-react).
 *     Pengecualian: components/Heatmap.jsx (grafik data, bukan ikon).
 *  3. Tidak boleh ada ikon dari pustaka lain (react-icons, heroicons, dst).
 *  4. Nama ikon yang di-import dari lucide-react harus dipakai.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib"];
const EXT = /\.(jsx?|css)$/;
const SVG_ALLOWED = new Set(["components/Heatmap.jsx"]);

// Emoji, piktograf, dingbat, panah, bentuk geometris, dan simbol campuran.
const GLYPH = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{27BF}\u{2900}-\u{297F}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;
const FOREIGN_ICONS = /from\s+["'](react-icons|@heroicons|@radix-ui\/react-icons|@tabler|phosphor-react|@phosphor-icons|@fortawesome|feather-icons|react-feather)/;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(name)) files.push(p);
  }
})(ROOT);
const scoped = files.filter((f) => DIRS.some((d) => relative(ROOT, f).startsWith(d + "/")));

const problems = [];
for (const file of scoped) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");
  src.split("\n").forEach((line, i) => {
    const g = line.match(GLYPH);
    if (g) problems.push(`${rel}:${i + 1}  glyph/emoji "${g[0]}" (pakai ikon lucide)`);
    if (/<svg[\s>]/.test(line) && !SVG_ALLOWED.has(rel)) problems.push(`${rel}:${i + 1}  <svg> inline (pakai lucide-react)`);
    if (FOREIGN_ICONS.test(line)) problems.push(`${rel}:${i + 1}  pustaka ikon selain lucide-react`);
  });
  const m = src.match(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/);
  if (m) {
    const body = src.replace(m[0], "");
    for (const raw of m[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/).pop();
      // dianggap dipakai bila muncul sebagai tag JSX, nilai prop/objek, ekspresi, atau argumen (bukan sekadar kata di teks)
      if (name && !new RegExp(`(?:[<{(\\[?:=,|&]|\\breturn)\\s*${name}(?![\\w-])`).test(body)) problems.push(`${rel}  ikon "${name}" di-import tapi tidak dipakai`);
    }
  }
}

if (problems.length) {
  console.error(`Pemeriksaan UI gagal (${problems.length} masalah):\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`Pemeriksaan UI lolos (${scoped.length} file): tanpa emoji, tanpa SVG inline, hanya lucide-react.`);
