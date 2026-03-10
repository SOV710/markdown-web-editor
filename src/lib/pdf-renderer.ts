import MarkdownIt from "markdown-it";
import katex from "katex";
import { encode } from "plantuml-encoder";
import { common, createLowlight } from "lowlight";
import { generateQRCodeDataURL } from "./qr-code";
import type { LocaleRef } from "@/i18n";

const lowlight = createLowlight(common);
const PLANTUML_SERVER = "https://www.plantuml.com/plantuml/svg";

// Simple hast (Hypertext Abstract Syntax Tree) to HTML serializer
interface HastText { type: "text"; value: string }
interface HastElement {
  type: "element";
  tagName: string;
  properties?: { className?: string[] };
  children?: HastNode[];
}
interface HastRoot { type: "root"; children?: HastNode[] }
type HastNode = HastText | HastElement | HastRoot;

function escapeForHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hastToHtml(node: HastNode): string {
  if (node.type === "text") return escapeForHtml(node.value);
  if (node.type === "root") return (node.children ?? []).map(hastToHtml).join("");
  if (node.type === "element") {
    const classes = node.properties?.className;
    const classAttr = classes?.length ? ` class="${escapeForHtml(classes.join(" "))}"` : "";
    const inner = (node.children ?? []).map(hastToHtml).join("");
    return `<${node.tagName}${classAttr}>${inner}</${node.tagName}>`;
  }
  return "";
}

// Placeholder prefix for async video QR code replacement
const VIDEO_PLACEHOLDER_PREFIX = "<!--VIDEO_QR_";
const VIDEO_PLACEHOLDER_SUFFIX = "-->";

interface VideoInfo {
  id: string;
  src: string;
  title: string;
}

export function createPdfMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

  // --- Math Inline: $...$ ---
  md.inline.ruler.after(
    "emphasis",
    "math_inline",
    (state, silent) => {
      if (state.src[state.pos] !== "$") return false;
      if (state.src[state.pos + 1] === "$") return false;

      const start = state.pos + 1;
      let end = start;

      while (end < state.src.length) {
        if (state.src[end] === "$" && state.src[end - 1] !== "\\") break;
        end++;
      }

      if (end >= state.src.length) return false;

      const latex = state.src.slice(start, end);
      if (!latex) return false;

      if (!silent) {
        const token = state.push("math_inline", "span", 0);
        token.content = latex;
      }

      state.pos = end + 1;
      return true;
    }
  );

  md.renderer.rules.math_inline = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch {
      return `<code>${md.utils.escapeHtml(latex)}</code>`;
    }
  };

  // --- Math Block: $$...$$ ---
  md.block.ruler.before(
    "fence",
    "math_block",
    (state, startLine, endLine, silent) => {
      const bMarkStart = state.bMarks[startLine];
      const tShiftStart = state.tShift[startLine];
      const eMarkStart = state.eMarks[startLine];
      if (bMarkStart === undefined || tShiftStart === undefined || eMarkStart === undefined) return false;

      const lineText = state.src.slice(bMarkStart + tShiftStart, eMarkStart).trim();
      if (lineText !== "$$") return false;

      let closingLine = startLine + 1;
      let found = false;

      while (closingLine < endLine) {
        const cBMark = state.bMarks[closingLine];
        const cTShift = state.tShift[closingLine];
        const cEMark = state.eMarks[closingLine];
        if (cBMark === undefined || cTShift === undefined || cEMark === undefined) {
          closingLine++;
          continue;
        }

        if (state.src.slice(cBMark + cTShift, cEMark).trim() === "$$") {
          found = true;
          break;
        }
        closingLine++;
      }

      if (!found) return false;
      if (silent) return true;

      const closingBMark = state.bMarks[closingLine];
      if (closingBMark === undefined) return false;

      const content = state.src.slice(eMarkStart + 1, closingBMark).trim();

      const token = state.push("math_block", "div", 0);
      token.content = content;
      token.map = [startLine, closingLine + 1];

      state.line = closingLine + 1;
      return true;
    }
  );

  md.renderer.rules.math_block = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    try {
      const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
      return `<div class="math-block-pdf">${html}</div>\n`;
    } catch {
      return `<pre class="math-error"><code>${md.utils.escapeHtml(latex)}</code></pre>\n`;
    }
  };

  // --- Video Block: @[title](url) ---
  let videoCounter = 0;
  const videoInfos: VideoInfo[] = [];

  md.block.ruler.before(
    "paragraph",
    "video_block",
    (state, startLine, _endLine, silent) => {
      const bMarkStart = state.bMarks[startLine];
      const tShiftStart = state.tShift[startLine];
      const eMarkStart = state.eMarks[startLine];
      if (bMarkStart === undefined || tShiftStart === undefined || eMarkStart === undefined) return false;

      const lineText = state.src.slice(bMarkStart + tShiftStart, eMarkStart).trim();
      const match = lineText.match(/^@\[([^\]]*)\]\(([^)]+)\)$/);
      if (!match) return false;
      if (silent) return true;

      const title = match[1] ?? "";
      const src = match[2] ?? "";
      const id = `video_${videoCounter++}`;

      videoInfos.push({ id, src, title });

      const token = state.push("video_block", "div", 0);
      token.content = src;
      token.meta = { id, src, title };
      token.map = [startLine, startLine + 1];

      state.line = startLine + 1;
      return true;
    }
  );

  md.renderer.rules.video_block = (tokens, idx) => {
    const meta = tokens[idx]?.meta as { id: string; src: string; title: string } | undefined;
    if (!meta) return "";
    // Insert placeholder that will be replaced with QR code after async generation
    return `${VIDEO_PLACEHOLDER_PREFIX}${meta.id}:${meta.src}:${meta.title}${VIDEO_PLACEHOLDER_SUFFIX}`;
  };

  // --- Highlight: ==text== ---
  md.inline.ruler.before(
    "emphasis",
    "highlight",
    (state, silent) => {
      const start = state.pos;
      const max = state.posMax;

      if (start + 1 >= max || state.src.charAt(start) !== "=" || state.src.charAt(start + 1) !== "=") {
        return false;
      }

      let pos = start + 2;
      while (pos + 1 < max) {
        if (state.src.charAt(pos) === "=" && state.src.charAt(pos + 1) === "=") {
          if (!silent) {
            const content = state.src.slice(start + 2, pos);
            if (content.length === 0) return false;

            const tokenOpen = state.push("highlight_open", "mark", 1);
            tokenOpen.markup = "==";
            const tokenText = state.push("text", "", 0);
            tokenText.content = content;
            const tokenClose = state.push("highlight_close", "mark", -1);
            tokenClose.markup = "==";
          }
          state.pos = pos + 2;
          return true;
        }
        pos++;
      }
      return false;
    }
  );

  md.renderer.rules.highlight_open = () => "<mark>";
  md.renderer.rules.highlight_close = () => "</mark>";

  // --- Fence override: plantuml + syntax-highlighted code ---
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    if (!token) return "";

    const info = token.info.trim();

    if (info === "plantuml") {
      const source = token.content;
      try {
        const encoded = encode(source);
        const url = `${PLANTUML_SERVER}/${encoded}`;
        return `<div class="plantuml-pdf"><img src="${md.utils.escapeHtml(url)}" alt="PlantUML Diagram" /></div>\n`;
      } catch {
        return `<pre><code>${md.utils.escapeHtml(source)}</code></pre>\n`;
      }
    }

    // Syntax-highlighted code blocks via lowlight
    const lang = info.split(/\s+/)[0] ?? "";
    const code = token.content;

    if (lang && lowlight.registered(lang)) {
      const tree = lowlight.highlight(lang, code);
      const highlighted = hastToHtml(tree as unknown as HastNode);
      return `<pre><code class="hljs language-${md.utils.escapeHtml(lang)}">${highlighted}</code></pre>\n`;
    }

    return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>\n`;
  };

  // Attach videoInfos getter for post-processing
  (md as MarkdownIt & { _videoInfos: VideoInfo[] })._videoInfos = videoInfos;

  return md;
}

function buildVideoCardHtml(
  qrDataUrl: string,
  src: string,
  title: string,
  localeRef: LocaleRef,
): string {
  const t = localeRef.current;
  const displayTitle = title || t.exportButton.videoLabel;
  const escapedSrc = src.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedTitle = displayTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<div class="video-card">
  <div class="video-card-title">${escapedTitle}</div>
  <img class="video-card-qr" src="${qrDataUrl}" alt="QR Code" width="200" height="200" />
  <div class="video-card-hint">${t.exportButton.scanToWatch}</div>
  <a class="video-card-link" href="${escapedSrc}">${escapedSrc}</a>
</div>`;
}

export async function renderMarkdownForPdf(
  markdown: string,
  localeRef: LocaleRef,
): Promise<string> {
  const md = createPdfMarkdownIt();
  let html = md.render(markdown);

  // Post-process: replace video placeholders with QR code cards
  const videoInfos = (md as MarkdownIt & { _videoInfos: VideoInfo[] })._videoInfos;

  for (const video of videoInfos) {
    const placeholder = `${VIDEO_PLACEHOLDER_PREFIX}${video.id}:${video.src}:${video.title}${VIDEO_PLACEHOLDER_SUFFIX}`;
    try {
      const qrDataUrl = await generateQRCodeDataURL(video.src);
      const card = buildVideoCardHtml(qrDataUrl, video.src, video.title, localeRef);
      html = html.replace(placeholder, card);
    } catch {
      // Fallback: just show a link
      const escapedSrc = md.utils.escapeHtml(video.src);
      html = html.replace(
        placeholder,
        `<div class="video-card"><a href="${escapedSrc}">${escapedSrc}</a></div>`
      );
    }
  }

  return buildFullHtmlDocument(html);
}

function buildFullHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PDF Export</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.37/dist/katex.min.css">
<style>
${PRINT_CSS}
</style>
</head>
<body>
<div class="pdf-content">
${bodyHtml}
</div>
</body>
</html>`;
}

const PRINT_CSS = `
/* ── Page Setup ── */
@page {
  size: A4;
  margin: 20mm 18mm;
}

/* ── Base ── */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.625;
  color: #1c1e21;
  background: #fff;
}

.pdf-content {
  max-width: 100%;
}

/* ── Headings ── */
h1 { font-size: 2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.2; }
h2 { font-size: 1.5em; font-weight: 600; margin-top: 1.4em; margin-bottom: 0.4em; line-height: 1.3; }
h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.3em; line-height: 1.4; }
h4 { font-size: 1.1em; font-weight: 600; margin-top: 1.1em; margin-bottom: 0.25em; line-height: 1.4; }
h5 { font-size: 1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.2em; line-height: 1.5; }
h6 { font-size: 0.875em; font-weight: 600; margin-top: 1em; margin-bottom: 0.2em; line-height: 1.5; color: #656d76; }

/* ── Paragraphs & Inline ── */
p { margin-bottom: 0.75em; }
strong { font-weight: 600; }
em { font-style: italic; }
u { text-decoration: underline; text-underline-offset: 2px; }
s { text-decoration: line-through; }
mark { background: rgba(255, 220, 0, 0.4); border-radius: 2px; padding: 1px 2px; }

/* ── Code (inline) ── */
code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  background: #f8f9fa;
  border: 1px solid #e2e4e8;
  border-radius: 4px;
  padding: 1px 4px;
}

/* ── Code blocks ── */
pre {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.8em;
  background: #f6f7f9;
  border: 1px solid #e2e4e8;
  border-left: 3px solid #cfd1d6;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  page-break-inside: avoid;
}

pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
}

/* ── Blockquote ── */
blockquote {
  border-left: 4px solid #2563eb;
  border-radius: 0 6px 6px 0;
  padding: 8px 12px;
  margin: 12px 0;
  background: rgba(37, 99, 235, 0.04);
  color: #656d76;
  font-style: italic;
}

/* ── Lists ── */
ul, ol { padding-left: 1.5em; margin: 8px 0; }
li { margin-bottom: 4px; }
li > p { margin-bottom: 0; }

/* ── Task list ── */
ul.contains-task-list { list-style: none; padding-left: 0; }
li.task-list-item { display: flex; align-items: flex-start; gap: 6px; }

/* ── Horizontal rule ── */
hr { border: none; border-top: 1px solid #e2e4e8; margin: 24px 0; }

/* ── Links ── */
a { color: #2563eb; text-decoration: none; }

/* ── Images ── */
img { max-width: 100%; height: auto; }

/* ── Table ── */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  page-break-inside: avoid;
}

th, td {
  border: 1px solid #e2e4e8;
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}

th { background: #f8f9fa; font-weight: 600; }

/* ── Math block ── */
.math-block-pdf {
  text-align: center;
  margin: 16px 0;
  padding: 12px;
  page-break-inside: avoid;
}

/* ── PlantUML ── */
.plantuml-pdf {
  text-align: center;
  margin: 16px 0;
  page-break-inside: avoid;
}

.plantuml-pdf img {
  max-width: 100%;
  height: auto;
}

/* ── Video QR Card ── */
.video-card {
  border: 1px solid #e2e4e8;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  text-align: center;
  background: #f8f9fa;
  page-break-inside: avoid;
}

.video-card-title {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 12px;
}

.video-card-qr {
  display: block;
  margin: 0 auto 12px;
}

.video-card-hint {
  color: #656d76;
  font-size: 0.9em;
  margin-bottom: 6px;
}

.video-card-link {
  color: #2563eb;
  font-size: 0.85em;
  word-break: break-all;
}

/* ── Syntax Highlighting (GitHub Light) ── */
.hljs { color: #24292e; }
.hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-type { color: #d73a49; }
.hljs-number, .hljs-selector-id, .hljs-attr { color: #005cc5; }
.hljs-string, .hljs-doctag, .hljs-regexp, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-template-variable, .hljs-variable { color: #032f62; }
.hljs-title, .hljs-section, .hljs-selector-class, .hljs-built_in { color: #6f42c1; }
.hljs-name, .hljs-tag { color: #22863a; }
.hljs-attribute, .hljs-selector { color: #e36209; }
.hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta { color: #005cc5; }
.hljs-addition { color: #22863a; background-color: #f0fff4; }
.hljs-deletion { color: #b31d28; background-color: #ffeef0; }

/* ── Print-specific ── */
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pdf-content { max-width: 100%; }
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
  pre, table, .math-block-pdf, .plantuml-pdf, .video-card { page-break-inside: avoid; }
  a[href]::after { content: none; }
}
`;
