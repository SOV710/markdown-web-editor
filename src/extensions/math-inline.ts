import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { inputRegex } from "./math-utils";
import katex from "katex";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      setMathInline: (attributes: { latex: string }) => ReturnType;
    };
  }
}

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
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
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "math-inline" }),
    ];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement("span");
      dom.classList.add("math-inline");
      dom.setAttribute("data-type", "math-inline");

      const renderMath = () => {
        const latex = node.attrs.latex as string;
        try {
          dom.innerHTML = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          dom.innerHTML = `<span class="math-error" title="Invalid LaTeX">${latex}</span>`;
        }
      };

      renderMath();

      dom.addEventListener("click", () => {
        if (!editor.isEditable) return;
        const newLatex = window.prompt("Edit LaTeX:", node.attrs.latex as string);
        if (newLatex !== null) {
          const pos = editor.view.posAtDOM(dom, 0);
          editor
            .chain()
            .focus()
            .setNodeSelection(pos)
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, { latex: newLatex });
              return true;
            })
            .run();
        }
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "mathInline") return false;
          node = updatedNode;
          renderMath();
          return true;
        },
      };
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: inputRegex,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex })
          );
        },
      }),
    ];
  },

  addCommands() {
    return {
      setMathInline:
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
