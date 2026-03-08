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
  bMarks: number[]; // byte offset of each line start
  eMarks: number[]; // byte offset of each line end
  tShift: number[]; // indent of first non-space char
  sCount: number[]; // indent level
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
            // Add block rule for $$...$$ using correct markdown-it block rule API
            markdownit.block.ruler.before(
              "fence",
              "math_block",
              (
                state: MarkdownItState,
                startLine: number,
                endLine: number,
                silent: boolean
              ) => {
                // 1. Get the start position of the current line
                const bMarkStart = state.bMarks[startLine];
                const tShiftStart = state.tShift[startLine];
                const eMarkStart = state.eMarks[startLine];
                if (
                  bMarkStart === undefined ||
                  tShiftStart === undefined ||
                  eMarkStart === undefined
                ) {
                  return false;
                }

                const lineStart = bMarkStart + tShiftStart;
                const lineEnd = eMarkStart;
                const lineText = state.src.slice(lineStart, lineEnd).trim();

                // 2. Must start with exactly "$$" (optionally with trailing whitespace)
                if (lineText !== "$$") return false;

                // 3. Find closing "$$" on a subsequent line
                let closingLine = startLine + 1;
                let found = false;

                while (closingLine < endLine) {
                  const cBMark = state.bMarks[closingLine];
                  const cTShift = state.tShift[closingLine];
                  const cEMark = state.eMarks[closingLine];
                  if (
                    cBMark === undefined ||
                    cTShift === undefined ||
                    cEMark === undefined
                  ) {
                    closingLine++;
                    continue;
                  }

                  const cLineStart = cBMark + cTShift;
                  const cLineEnd = cEMark;
                  const cLineText = state.src.slice(cLineStart, cLineEnd).trim();

                  if (cLineText === "$$") {
                    found = true;
                    break;
                  }
                  closingLine++;
                }

                if (!found) return false;
                if (silent) return true;

                // 4. Extract content between opening and closing lines
                const closingBMark = state.bMarks[closingLine];
                if (closingBMark === undefined) return false;

                const contentStart = eMarkStart + 1; // after opening $$ newline
                const contentEnd = closingBMark; // before closing $$ line
                const content = state.src.slice(contentStart, contentEnd).trim();

                // 5. Create token
                const token = state.push("math_block", "div", 0);
                token.content = content;
                token.map = [startLine, closingLine + 1];
                token.attrSet("data-type", "math-block");
                token.attrSet("data-latex", content);

                // 6. Advance past closing line
                state.line = closingLine + 1;

                return true;
              }
            );

            // Add renderer for math_block token
            markdownit.renderer.rules.math_block = (
              tokens: Array<{ content: string }>,
              idx: number
            ) => {
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
