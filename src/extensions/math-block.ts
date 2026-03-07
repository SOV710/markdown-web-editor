import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import katex from "katex";

// Types for tiptap-markdown serialization
interface MarkdownSerializerState {
  write(text: string): void;
  text(text: string, escape?: boolean): void;
  ensureNewLine(): void;
  closeBlock(node: ProseMirrorNode): void;
}

interface MarkdownItState {
  src: string;
  line: number;
  lineMax: number;
  push(type: string, tag: string, nesting: number): {
    content: string;
    map: [number, number] | null;
    attrSet(name: string, value: string): void;
  };
  getLines(begin: number, end: number, indent: number, keepLastLF: boolean): string;
}

interface MarkdownItInstance {
  block: {
    ruler: {
      before(name: string, ruleName: string, fn: (state: MarkdownItState, startLine: number, endLine: number, silent: boolean) => boolean): void;
    };
  };
  renderer: {
    rules: Record<string, (tokens: Array<{ content: string }>, idx: number) => string>;
  };
  utils: {
    escapeHtml(str: string): string;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (attributes: { latex: string }) => ReturnType;
    };
  }
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            latex: el.getAttribute("latex") || el.getAttribute("data-latex") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block" }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          state.write("$$\n");
          state.text(node.attrs.latex as string, false);
          state.ensureNewLine();
          state.write("$$");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownItInstance) {
            // Add block rule for $$...$$
            markdownit.block.ruler.before("fence", "math_block", (state: MarkdownItState, startLine: number, _endLine: number, silent: boolean) => {
              const startPos = state.src.indexOf("$$", state.line);
              if (startPos === -1) return false;

              // Check if line starts with $$
              const lineStart = state.src.lastIndexOf("\n", startPos) + 1;
              const lineText = state.src.slice(lineStart, state.src.indexOf("\n", lineStart) || state.src.length);
              if (!lineText.trim().startsWith("$$")) return false;

              // Find closing $$
              let pos = startPos + 2;
              let foundEnd = false;
              let endPos = pos;

              while (pos < state.src.length) {
                const idx = state.src.indexOf("$$", pos);
                if (idx === -1) break;

                // Check if it's on its own line
                const beforeNewline = state.src.lastIndexOf("\n", idx);
                const afterNewline = state.src.indexOf("\n", idx);
                const line = state.src.slice(beforeNewline + 1, afterNewline === -1 ? undefined : afterNewline);
                if (line.trim() === "$$") {
                  endPos = idx;
                  foundEnd = true;
                  break;
                }
                pos = idx + 2;
              }

              if (!foundEnd) return false;

              if (silent) return true;

              // Extract content between $$
              const content = state.src.slice(startPos + 2, endPos).trim();

              const token = state.push("math_block", "div", 0);
              token.content = content;
              token.attrSet("data-type", "math-block");
              token.attrSet("data-latex", content);

              // Skip past the closing $$
              const linesConsumed = state.src.slice(0, endPos + 2).split("\n").length;
              state.line = startLine + linesConsumed;

              return true;
            });

            // Add renderer for math_block token
            markdownit.renderer.rules.math_block = (tokens: Array<{ content: string }>, idx: number) => {
              const token = tokens[idx];
              if (!token) return "";
              const latex = token.content;
              return `<div data-type="math-block" data-latex="${markdownit.utils.escapeHtml(latex)}"></div>\n`;
            };
          },
          updateDOM(element: HTMLElement) {
            // Transfer data-latex to latex attribute for TipTap parsing
            const latex = element.getAttribute("data-latex");
            if (latex) {
              element.setAttribute("latex", latex);
            }
          },
        },
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.classList.add("math-block");
      dom.setAttribute("data-type", "math-block");

      const textarea = document.createElement("textarea");
      textarea.classList.add("math-block-input");
      textarea.value = node.attrs.latex as string;
      textarea.placeholder = "Enter LaTeX...";
      textarea.rows = 3;

      const preview = document.createElement("div");
      preview.classList.add("math-block-preview");

      const renderMath = (latex: string) => {
        try {
          preview.innerHTML = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
          });
          preview.classList.remove("math-error");
        } catch (error) {
          preview.innerHTML = `<span class="math-error">Invalid LaTeX: ${latex}</span>`;
          preview.classList.add("math-error");
        }
      };

      renderMath(node.attrs.latex as string);

      textarea.addEventListener("input", () => {
        renderMath(textarea.value);
      });

      textarea.addEventListener("blur", () => {
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos === undefined) return;

        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { latex: textarea.value });
            return true;
          })
          .run();
      });

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          textarea.blur();
          editor.commands.focus();
        }
      });

      dom.appendChild(textarea);
      dom.appendChild(preview);

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "mathBlock") return false;
          if (document.activeElement !== textarea) {
            textarea.value = updatedNode.attrs.latex as string;
            renderMath(updatedNode.attrs.latex as string);
          }
          return true;
        },
        stopEvent: (event) => {
          return event.target === textarea;
        },
        ignoreMutation: () => true,
      };
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create({ latex: "" }));
        },
      }),
    ];
  },

  addCommands() {
    return {
      setMathBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
