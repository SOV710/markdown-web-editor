import TurndownService from "turndown";
import MarkdownIt from "markdown-it";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Add rules for task lists
turndownService.addRule("taskListItem", {
  filter: (node) => {
    return (
      node.nodeName === "LI" &&
      node.parentElement?.getAttribute("data-type") === "taskList"
    );
  },
  replacement: (content, node) => {
    const checkbox = (node as HTMLElement).querySelector('input[type="checkbox"]');
    const checked = checkbox?.hasAttribute("checked") ?? false;
    const cleanContent = content.replace(/^\s*\n/, "").trim();
    return `- [${checked ? "x" : " "}] ${cleanContent}\n`;
  },
});

// Add rule for code blocks with language
turndownService.addRule("fencedCodeBlock", {
  filter: (node) => {
    return (
      node.nodeName === "PRE" &&
      node.querySelector("code") !== null
    );
  },
  replacement: (_content, node) => {
    const code = (node as HTMLElement).querySelector("code");
    if (!code) return "";
    const language = code.className.match(/language-(\w+)/)?.[1] ?? "";
    const text = code.textContent ?? "";
    return `\n\`\`\`${language}\n${text}\n\`\`\`\n`;
  },
});

// Add rule for math blocks
turndownService.addRule("mathBlock", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      (node as HTMLElement).classList.contains("math-block")
    );
  },
  replacement: (_content, node) => {
    const latex = (node as HTMLElement).getAttribute("data-latex") ?? "";
    return `\n$$\n${latex}\n$$\n`;
  },
});

// Add rule for inline math
turndownService.addRule("mathInline", {
  filter: (node) => {
    return (
      node.nodeName === "SPAN" &&
      (node as HTMLElement).classList.contains("math-inline")
    );
  },
  replacement: (_content, node) => {
    const latex = (node as HTMLElement).getAttribute("data-latex") ?? "";
    return `$${latex}$`;
  },
});

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export function markdownToHtml(markdown: string): string {
  return md.render(markdown);
}
