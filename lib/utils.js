export const cx = (...a) => a.filter(Boolean).join(" ");

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
export function timeAgo(date) {
  if (!date) return "";
  const s = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const steps = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, sec] of steps) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
  return "baru saja";
}

export function fmtBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  const u = ["KB", "MB", "GB"];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${u[i]}`;
}

export function fmtNum(n = 0) {
  if (n < 1000) return String(n);
  if (n < 1e6) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
}

export const encPath = (p = "") => p.split("/").filter(Boolean).map(encodeURIComponent).join("/");

/** /owner/repo/<kind>/<ref>/<path> */
export function repoUrl(owner, repo, kind = "", ref = "", path = "") {
  const tail = [kind, ref && encPath(ref), path && encPath(path)].filter(Boolean).join("/");
  return `/${owner}/${repo}${tail ? `/${tail}` : ""}`;
}

/** Hanya izinkan http(s) untuk link buatan pengguna (homepage repo, blog profil). */
export function safeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}

export const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", Go: "#00ADD8",
  Rust: "#dea584", "C++": "#f34b7d", C: "#555555", "C#": "#178600", PHP: "#4F5D95", Ruby: "#701516",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26", CSS: "#563d7c", SCSS: "#c6538c",
  Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00", Lua: "#000080", Dockerfile: "#384d54", Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B", Makefile: "#427819", Astro: "#ff5a03",
};
export const langColor = (l) => LANG_COLORS[l] || "#8b949e";

/** Peta URL API GitHub (dari notifikasi) ke route RepoHub. */
export function apiUrlToPath(url = "") {
  const m = url.match(/repos\/([^/]+)\/([^/]+)\/(issues|pulls|commits|releases)\/?([^/?#]*)/);
  if (!m) return "/notifications";
  const [, o, r, kind, id] = m;
  if (kind === "issues") return `/${o}/${r}/issues/${id}`;
  if (kind === "pulls") return `/${o}/${r}/pull/${id}`;
  if (kind === "commits") return `/${o}/${r}/commit/${id}`;
  return `/${o}/${r}/releases`;
}

export const isTextName = (name) =>
  /\.(md|markdown|txt|json|jsonc|ya?ml|toml|ini|env|lock|csv|tsv|xml|html?|css|scss|less|jsx?|tsx?|mjs|cjs|vue|svelte|py|rb|go|rs|java|kt|swift|c|h|cpp|hpp|cs|php|sh|bash|zsh|sql|graphql|gitignore|gitattributes|dockerfile|makefile|log)$/i.test(name) ||
  !name.includes(".");

export const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|ico|bmp|svg)$/i;
export const MD_RE = /\.(md|markdown)$/i;
