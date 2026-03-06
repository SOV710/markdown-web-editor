import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { encode } from "plantuml-encoder";

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
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "plantuml-block" }),
    ];
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
