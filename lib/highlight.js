import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import sql from "highlight.js/lib/languages/sql";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import kotlin from "highlight.js/lib/languages/kotlin";
import swift from "highlight.js/lib/languages/swift";
import ini from "highlight.js/lib/languages/ini";

const langs = { javascript, typescript, python, json, xml, css, scss, bash, yaml, markdown, go, rust, java, cpp, csharp, php, ruby, sql, dockerfile, kotlin, swift, ini };
for (const [name, def] of Object.entries(langs)) hljs.registerLanguage(name, def);

const EXT = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", json: "json", jsonc: "json", html: "xml", htm: "xml", xml: "xml", svg: "xml", vue: "xml", svelte: "xml",
  css: "css", scss: "scss", sh: "bash", bash: "bash", zsh: "bash", yml: "yaml", yaml: "yaml", md: "markdown",
  go: "go", rs: "rust", java: "java", c: "cpp", h: "cpp", cpp: "cpp", hpp: "cpp", cs: "csharp", php: "php",
  rb: "ruby", sql: "sql", kt: "kotlin", swift: "swift", toml: "ini", ini: "ini", env: "ini",
};

export function langFor(name = "") {
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  return EXT[lower.split(".").pop()] || null;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Highlight lalu pecah per baris; span yang melintasi baris ditutup & dibuka lagi. */
export function highlightLines(code, name) {
  const lang = langFor(name);
  let html;
  try { html = lang ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code); }
  catch { html = esc(code); }
  const out = [];
  let open = [];
  for (const raw of html.split("\n")) {
    let line = open.join("") + raw;
    const re = /<span[^>]*>|<\/span>/g;
    let m;
    const stack = [...open];
    while ((m = re.exec(raw))) {
      if (m[0] === "</span>") stack.pop(); else stack.push(m[0]);
    }
    line += "</span>".repeat(stack.length);
    open = stack;
    out.push(line);
  }
  if (out.length > 1 && out[out.length - 1] === "") out.pop();
  return out;
}

/** Highlight potongan kode (untuk blok ```lang di markdown). Output sudah di-escape oleh highlight.js. */
export function highlightHtml(code, lang) {
  try {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch {}
  return esc(code);
}
