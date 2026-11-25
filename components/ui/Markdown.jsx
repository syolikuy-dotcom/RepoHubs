import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { encPath } from "@/lib/utils";
import { highlightHtml } from "@/lib/highlight";

const ALERTS = { NOTE: "Catatan", TIP: "Tips", IMPORTANT: "Penting", WARNING: "Peringatan", CAUTION: "Awas" };

/** Dukungan alert GitHub: > [!NOTE] ... Dijalankan SETELAH sanitize supaya className lolos. */
function rehypeAlerts() {
  const walk = (node) => {
    node.children?.forEach(walk);
    if (node.type !== "element" || node.tagName !== "blockquote") return;
    const p = node.children.find((c) => c.type === "element" && c.tagName === "p");
    const first = p?.children?.[0];
    const m = first?.type === "text" && /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i.exec(first.value);
    if (!m) return;
    const kind = m[1].toUpperCase();
    first.value = first.value.slice(m[0].length);
    node.properties = { ...node.properties, className: ["md-alert", `md-alert-${kind.toLowerCase()}`] };
    node.children.unshift({ type: "element", tagName: "p", properties: { className: ["md-alert-title"] }, children: [{ type: "text", value: ALERTS[kind] }] });
  };
  return walk;
}

function normalize(path) {
  const out = [];
  for (const p of path.split("/")) {
    if (p === "..") out.pop(); else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}

/**
 * Render markdown aman (disanitasi). `ctx` = { owner, repo, ref, dir } agar gambar dan
 * link relatif di README tetap jalan, termasuk untuk repo private.
 */
export default function Markdown({ children, ctx, small = false }) {
  const urlTransform = (url, key) => {
    if (!url) return url;
    if (/^(https?:|mailto:|#)/i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return "";
    if (!ctx) return url;
    const abs = normalize(url.startsWith("/") ? url : `${ctx.dir || ""}/${url}`);
    if (key === "src") {
      return `/api/raw?repo=${encodeURIComponent(`${ctx.owner}/${ctx.repo}`)}&ref=${encodeURIComponent(ctx.ref || "")}&path=${encodeURIComponent(abs)}`;
    }
    return `/${ctx.owner}/${ctx.repo}/blob/${encPath(ctx.ref || "")}/${encPath(abs)}`;
  };
  return (
    <div className={`md${small ? " md-sm" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeAlerts]}
        urlTransform={urlTransform}
        components={{
          code: ({ className, children: c }) => {
            const m = /language-([\w-]+)/.exec(className || "");
            if (!m) return <code className={className}>{c}</code>;
            return <code className={`hljs language-${m[1]}`} dangerouslySetInnerHTML={{ __html: highlightHtml(String(c).replace(/\n$/, ""), m[1]) }} />;
          },
          a: ({ href, children: c }) => {
            const external = /^https?:/i.test(href || "");
            return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>{c}</a>;
          },
          img: ({ src, alt }) => <img src={src} alt={alt || ""} loading="lazy" />,
        }}
      >
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}
