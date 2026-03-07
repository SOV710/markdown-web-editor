import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { encode } from "plantuml-encoder";

// Types for tiptap-markdown serialization
interface MarkdownSerializerState {
  write(text: string): void;
  text(text: string, escape?: boolean): void;
  ensureNewLine(): void;
  closeBlock(node: ProseMirrorNode): void;
}

interface MarkdownItInstance {
  renderer: {
    rules: Record<string, (tokens: Array<{ info: string; content: string }>, idx: number) => string | undefined>;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    plantumlBlock: {
      setPlantUMLBlock: (attributes: { source: string }) => ReturnType;
    };
  }
}

const PLANTUML_SERVER = "https://www.plantuml.com/plantuml/svg";

export const PlantUMLBlock = Node.create({
  name: "plantumlBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      source: {
        default: "@startuml\n\n@enduml",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="plantuml-block"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            source: el.getAttribute("source") || el.getAttribute("data-source") || "@startuml\n\n@enduml",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "plantuml-block" }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          state.write("```plantuml\n");
          state.text(node.attrs.source as string, false);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownItInstance) {
            // Override fence renderer to handle plantuml specially
            markdownit.renderer.rules.fence = (tokens: Array<{ info: string; content: string }>, idx: number) => {
              const token = tokens[idx];
              if (!token) return "";

              const info = token.info.trim();
              if (info === "plantuml") {
                const source = token.content;
                // Return HTML that will be parsed as plantumlBlock
                return `<div data-type="plantuml-block" data-source="${source.replace(/"/g, "&quot;")}"></div>\n`;
              }

              // Fall back to default fence rendering for other languages
              const escapedContent = token.content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              return `<pre><code class="language-${info}">${escapedContent}</code></pre>\n`;
            };
          },
          updateDOM(element: HTMLElement) {
            // Transfer data-source to source attribute for TipTap parsing
            const source = element.getAttribute("data-source");
            if (source) {
              element.setAttribute("source", source);
            }
          },
        },
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.classList.add("plantuml-block");
      dom.setAttribute("data-type", "plantuml-block");

      const textarea = document.createElement("textarea");
      textarea.classList.add("plantuml-block-input");
      textarea.value = node.attrs.source as string;
      textarea.placeholder = "@startuml\nAlice -> Bob: Hello\n@enduml";
      textarea.rows = 6;

      const preview = document.createElement("div");
      preview.classList.add("plantuml-block-preview");

      const img = document.createElement("img");
      img.classList.add("plantuml-block-img");
      preview.appendChild(img);

      const errorDiv = document.createElement("div");
      errorDiv.classList.add("plantuml-error");
      errorDiv.style.display = "none";
      preview.appendChild(errorDiv);

      let debounceTimer: ReturnType<typeof setTimeout>;

      const renderDiagram = (source: string) => {
        if (!source.trim()) {
          img.style.display = "none";
          errorDiv.style.display = "none";
          return;
        }

        try {
          const encoded = encode(source);
          const url = `${PLANTUML_SERVER}/${encoded}`;
          img.src = url;
          img.alt = "PlantUML Diagram";
          img.style.display = "block";
          errorDiv.style.display = "none";

          img.onerror = () => {
            img.style.display = "none";
            errorDiv.textContent = "Failed to render diagram";
            errorDiv.style.display = "block";
          };
        } catch (error) {
          img.style.display = "none";
          errorDiv.textContent = "Invalid PlantUML syntax";
          errorDiv.style.display = "block";
        }
      };

      renderDiagram(node.attrs.source as string);

      textarea.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderDiagram(textarea.value);
        }, 500);
      });

      textarea.addEventListener("blur", () => {
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos === undefined) return;

        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { source: textarea.value });
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
          if (updatedNode.type.name !== "plantumlBlock") return false;
          if (document.activeElement !== textarea) {
            textarea.value = updatedNode.attrs.source as string;
            renderDiagram(updatedNode.attrs.source as string);
          }
          return true;
        },
        stopEvent: (event) => {
          return event.target === textarea;
        },
        ignoreMutation: () => true,
        destroy: () => {
          clearTimeout(debounceTimer);
        },
      };
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^```plantuml$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ source: "@startuml\n\n@enduml" })
          );
        },
      }),
    ];
  },

  addCommands() {
    return {
      setPlantUMLBlock:
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
