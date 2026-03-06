import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import katex from "katex";

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
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block" }),
    ];
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
