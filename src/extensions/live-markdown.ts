import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const liveMarkdownPluginKey = new PluginKey("liveMarkdown");

/**
 * Markdown syntax markers for different node/mark types.
 */
const SYNTAX_MARKERS: Record<string, { prefix: string; suffix: string }> = {
  bold: { prefix: "**", suffix: "**" },
  italic: { prefix: "_", suffix: "_" },
  strike: { prefix: "~~", suffix: "~~" },
  code: { prefix: "`", suffix: "`" },
  highlight: { prefix: "==", suffix: "==" },
};

const HEADING_MARKERS: Record<number, string> = {
  1: "# ",
  2: "## ",
  3: "### ",
  4: "#### ",
  5: "##### ",
  6: "###### ",
};

/**
 * Live Markdown Preview Extension
 *
 * Shows Markdown syntax when the cursor is inside a formatted element,
 * hides it when the cursor moves elsewhere (Typora-style).
 */
export const LiveMarkdown = Extension.create({
  name: "liveMarkdown",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: liveMarkdownPluginKey,
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const { $from } = selection;

            // Get cursor position info
            const cursorPos = $from.pos;

            // Check if we're in a heading
            for (let depth = $from.depth; depth >= 0; depth--) {
              const node = $from.node(depth);

              if (node.type.name === "heading") {
                const level = node.attrs.level as number;
                const marker = HEADING_MARKERS[level];

                if (marker) {
                  const nodeStart = $from.start(depth);

                  // Add decoration to show the heading marker
                  decorations.push(
                    Decoration.widget(nodeStart, () => {
                      const span = document.createElement("span");
                      span.className = "live-md-heading-marker";
                      span.textContent = marker;
                      return span;
                    })
                  );
                }
                break;
              }
            }

            // Find all marks at cursor position and show their syntax
            const cursorMarks = $from.marks();

            if (cursorMarks.length > 0) {
              // Find the text range with the same marks
              const parent = $from.parent;
              const parentStart = $from.start();
              const markEnd = parentStart + parent.content.size;

              // Find the exact range of the current marked text
              doc.nodesBetween(parentStart, markEnd, (node, pos) => {
                if (node.isText) {
                  const nodeEnd = pos + node.nodeSize;

                  // Check if this text node contains the cursor
                  if (cursorPos >= pos && cursorPos <= nodeEnd) {
                    const nodeMarks = node.marks;

                    // Check each mark at cursor and add decorations
                    for (const mark of cursorMarks) {
                      const markType = mark.type.name;
                      const syntax = SYNTAX_MARKERS[markType];

                      if (syntax && nodeMarks.some((m) => m.type === mark.type)) {
                        // Find the extent of this mark
                        let mStart = pos;
                        let mEnd = nodeEnd;

                        // Look backwards for mark start
                        doc.nodesBetween(parentStart, pos, (n, p) => {
                          if (n.isText && n.marks.some((m) => m.type === mark.type)) {
                            mStart = p;
                          }
                        });

                        // Look forwards for mark end
                        doc.nodesBetween(pos, markEnd, (n, p) => {
                          if (n.isText && n.marks.some((m) => m.type === mark.type)) {
                            mEnd = p + n.nodeSize;
                          }
                        });

                        // Add prefix widget
                        decorations.push(
                          Decoration.widget(mStart, () => {
                            const span = document.createElement("span");
                            span.className = `live-md-mark live-md-${markType}`;
                            span.textContent = syntax.prefix;
                            return span;
                          })
                        );

                        // Add suffix widget
                        decorations.push(
                          Decoration.widget(mEnd, () => {
                            const span = document.createElement("span");
                            span.className = `live-md-mark live-md-${markType}`;
                            span.textContent = syntax.suffix;
                            return span;
                          })
                        );
                      }
                    }
                  }
                }
                return true;
              });
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
