import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const headingPlaceholderPluginKey = new PluginKey("headingPlaceholder");

const HEADING_PLACEHOLDERS: Record<number, string> = {
  1: "Heading 1",
  2: "Heading 2",
  3: "Heading 3",
  4: "Heading 4",
  5: "Heading 5",
  6: "Heading 6",
};

/**
 * Heading Placeholder Extension
 *
 * Shows placeholder text (e.g., "Heading 1") when the cursor is inside
 * an empty heading node.
 */
export const HeadingPlaceholder = Extension.create({
  name: "headingPlaceholder",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: headingPlaceholderPluginKey,
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];

            // Only add placeholder if the selection is empty (cursor, not range)
            if (!selection.empty) {
              return DecorationSet.empty;
            }

            const { $from } = selection;

            // Find if we're inside a heading
            for (let depth = $from.depth; depth >= 0; depth--) {
              const node = $from.node(depth);

              if (node.type.name === "heading") {
                // Check if the heading is empty
                if (node.content.size === 0) {
                  const level = node.attrs.level as number;
                  const placeholder = HEADING_PLACEHOLDERS[level];

                  if (placeholder) {
                    const pos = $from.start(depth);
                    decorations.push(
                      Decoration.node(pos - 1, pos - 1 + node.nodeSize, {
                        class: "is-empty",
                        "data-placeholder": placeholder,
                      })
                    );
                  }
                }
                break;
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
