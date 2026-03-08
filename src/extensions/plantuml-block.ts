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
  utils: {
    escapeHtml(str: string): string;
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
                return `<div data-type="plantuml-block" data-source="${markdownit.utils.escapeHtml(source)}"></div>\n`;
              }

              // Fall back to default fence rendering for other languages
              const escapedContent = markdownit.utils.escapeHtml(token.content);
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

      // Create textarea (hidden by default in collapsed state)
      const textarea = document.createElement("textarea");
      textarea.classList.add("plantuml-block-input");
      textarea.value = node.attrs.source as string;
      textarea.placeholder = "@startuml\nAlice -> Bob: Hello\n@enduml";
      textarea.rows = 6;

      // Create preview container (visible by default in collapsed state)
      const preview = document.createElement("div");
      preview.classList.add("plantuml-block-preview");

      const img = document.createElement("img");
      img.classList.add("plantuml-block-img");
      preview.appendChild(img);

      const loadingDiv = document.createElement("div");
      loadingDiv.classList.add("plantuml-block-loading");
      loadingDiv.textContent = "Rendering...";
      loadingDiv.style.display = "none";
      preview.appendChild(loadingDiv);

      const errorDiv = document.createElement("div");
      errorDiv.classList.add("plantuml-error");
      errorDiv.style.display = "none";
      preview.appendChild(errorDiv);

      // State management
      let isEditing = false;
      let currentNode = node;

      const renderDiagram = (source: string) => {
        const trimmed = source.trim();
        const isDefault = !trimmed || trimmed === "@startuml\n\n@enduml" || trimmed === "@startuml\n@enduml";

        if (isDefault) {
          img.style.display = "none";
          loadingDiv.style.display = "none";
          errorDiv.style.display = "none";
          // Show placeholder for empty diagrams
          const placeholder = preview.querySelector(".plantuml-placeholder");
          if (!placeholder) {
            const p = document.createElement("span");
            p.classList.add("plantuml-placeholder");
            p.textContent = "Click to add diagram";
            preview.appendChild(p);
          }
          return;
        }

        // Remove placeholder if exists
        const placeholder = preview.querySelector(".plantuml-placeholder");
        if (placeholder) placeholder.remove();

        try {
          const encoded = encode(source);
          const url = `${PLANTUML_SERVER}/${encoded}`;

          // Show loading indicator
          loadingDiv.style.display = "block";
          img.style.display = "none";
          errorDiv.style.display = "none";

          img.src = url;
          img.alt = "PlantUML Diagram";

          img.onload = () => {
            loadingDiv.style.display = "none";
            img.style.display = "block";
            errorDiv.style.display = "none";
          };

          img.onerror = () => {
            loadingDiv.style.display = "none";
            img.style.display = "none";
            errorDiv.textContent = "Failed to render diagram";
            errorDiv.style.display = "block";
          };
        } catch {
          loadingDiv.style.display = "none";
          img.style.display = "none";
          errorDiv.textContent = "Invalid PlantUML syntax";
          errorDiv.style.display = "block";
        }
      };

      const autoResizeTextarea = () => {
        textarea.style.height = "auto";
        textarea.style.height = Math.max(80, textarea.scrollHeight) + "px";
      };

      const enterEditMode = () => {
        if (isEditing) return;
        isEditing = true;

        // Hide preview, show textarea
        preview.style.display = "none";
        textarea.style.display = "block";

        // Sync textarea value from current node attrs
        textarea.value = currentNode.attrs.source as string;
        autoResizeTextarea();

        // Focus the textarea
        textarea.focus();
      };

      const exitEditMode = () => {
        if (!isEditing) return;

        // Save changes if value differs
        const newSource = textarea.value;
        if (newSource !== currentNode.attrs.source) {
          if (typeof getPos === "function") {
            const pos = getPos();
            if (pos !== undefined) {
              editor.view.dispatch(
                editor.view.state.tr.setNodeMarkup(pos, undefined, { source: newSource })
              );
            }
          }
        }

        isEditing = false;

        // Hide textarea, show preview
        textarea.style.display = "none";
        preview.style.display = "flex";

        // Re-render diagram with current value
        renderDiagram(textarea.value);
      };

      // Initial render
      renderDiagram(node.attrs.source as string);

      // Check if content is empty or default
      const isEmptyOrDefault = (source: string) => {
        const trimmed = source.trim();
        return !trimmed || trimmed === "@startuml\n\n@enduml" || trimmed === "@startuml\n@enduml";
      };

      // If content is empty or default, start in expanded mode
      if (isEmptyOrDefault(node.attrs.source as string)) {
        // Start expanded
        preview.style.display = "none";
        textarea.style.display = "block";
        isEditing = true;
        // Focus will be called by selectNode
      } else {
        // Start collapsed
        preview.style.display = "flex";
        textarea.style.display = "none";
      }

      // Click on preview enters edit mode
      preview.addEventListener("click", () => {
        enterEditMode();
      });

      // Textarea input - auto-resize
      textarea.addEventListener("input", () => {
        autoResizeTextarea();
      });

      // Textarea blur exits edit mode
      textarea.addEventListener("blur", () => {
        // Small delay to allow selectNode/deselectNode to fire first
        setTimeout(() => {
          if (isEditing && document.activeElement !== textarea) {
            exitEditMode();
          }
        }, 0);
      });

      // Escape key exits edit mode
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          exitEditMode();
          editor.commands.focus();
        }
      });

      dom.appendChild(preview);
      dom.appendChild(textarea);

      return {
        dom,
        selectNode: () => {
          enterEditMode();
        },
        deselectNode: () => {
          exitEditMode();
        },
        update: (updatedNode) => {
          if (updatedNode.type.name !== "plantumlBlock") return false;
          currentNode = updatedNode;
          if (!isEditing) {
            textarea.value = updatedNode.attrs.source as string;
            renderDiagram(updatedNode.attrs.source as string);
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
