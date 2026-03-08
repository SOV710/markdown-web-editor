import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const typoraModeKey = new PluginKey("typoraMode");

/**
 * Markdown syntax markers for inline marks.
 */
const MARK_SYNTAX: Record<string, { prefix: string; suffix: string }> = {
  bold: { prefix: "**", suffix: "**" },
  italic: { prefix: "_", suffix: "_" },
  strike: { prefix: "~~", suffix: "~~" },
  code: { prefix: "`", suffix: "`" },
  highlight: { prefix: "==", suffix: "==" },
};

/**
 * Heading markers for block-level decorations.
 */
const HEADING_MARKERS: Record<number, string> = {
  1: "# ",
  2: "## ",
  3: "### ",
  4: "#### ",
  5: "##### ",
  6: "###### ",
};

/**
 * Information about a currently expanded mark range.
 */
interface ExpandedMark {
  /** The mark type name (e.g., "bold") */
  markType: string;
  /** Position where the opening syntax starts */
  from: number;
  /** Position where the closing syntax ends */
  to: number;
  /** Length of the prefix syntax (e.g., 2 for "**") */
  prefixLen: number;
  /** Length of the suffix syntax (e.g., 2 for "**") */
  suffixLen: number;
  /** The text content (without syntax markers) */
  text: string;
}

interface TyporaModeState {
  expanded: ExpandedMark | null;
}

/**
 * Find a mark at the cursor position that we can expand.
 */
function findMarkAtCursor(
  state: EditorState
): { markType: string; from: number; to: number; text: string } | null {
  const { selection, doc } = state;

  // Only handle cursor (empty selection)
  if (!selection.empty) return null;

  const $from = selection.$from;
  const cursorPos = $from.pos;
  const cursorMarks = $from.marks();

  // Find the first expandable mark
  for (const mark of cursorMarks) {
    const markTypeName = mark.type.name;
    if (!MARK_SYNTAX[markTypeName]) continue;

    // Find the extent of this mark by iterating through text nodes in the parent
    const parent = $from.parent;
    const parentStart = $from.start();
    const parentEnd = parentStart + parent.content.size;

    // Collect all text nodes with their positions
    interface TextNodeInfo {
      from: number;
      to: number;
      hasMark: boolean;
    }
    const textNodes: TextNodeInfo[] = [];

    doc.nodesBetween(parentStart, parentEnd, (node, pos) => {
      if (node.isText) {
        textNodes.push({
          from: pos,
          to: pos + node.nodeSize,
          hasMark: node.marks.some((m) => m.type === mark.type),
        });
      }
      return true;
    });

    // Find which text node contains the cursor
    let cursorNodeIndex = -1;
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      if (node && cursorPos >= node.from && cursorPos <= node.to) {
        cursorNodeIndex = i;
        break;
      }
    }

    if (cursorNodeIndex === -1) continue;

    const cursorNode = textNodes[cursorNodeIndex];
    if (!cursorNode || !cursorNode.hasMark) continue;

    // Expand to find the full range of consecutive nodes with this mark
    let markStart = cursorNode.from;
    let markEnd = cursorNode.to;

    // Scan backwards
    for (let i = cursorNodeIndex - 1; i >= 0; i--) {
      const node = textNodes[i];
      if (node && node.hasMark) {
        markStart = node.from;
      } else {
        break;
      }
    }

    // Scan forwards
    for (let i = cursorNodeIndex + 1; i < textNodes.length; i++) {
      const node = textNodes[i];
      if (node && node.hasMark) {
        markEnd = node.to;
      } else {
        break;
      }
    }

    // Ensure we have a valid range
    if (markEnd > markStart) {
      const text = doc.textBetween(markStart, markEnd);
      return {
        markType: markTypeName,
        from: markStart,
        to: markEnd,
        text,
      };
    }
  }

  return null;
}

/**
 * Create a transaction to expand a mark (show syntax characters).
 */
function createExpandTransaction(
  state: EditorState,
  markInfo: { markType: string; from: number; to: number; text: string }
): Transaction | null {
  const syntax = MARK_SYNTAX[markInfo.markType];
  if (!syntax) return null;

  const { from, to, text, markType } = markInfo;
  const markTypeObj = state.schema.marks[markType];
  if (!markTypeObj) return null;

  // Create the transaction
  const tr = state.tr;

  // Calculate cursor position in original text
  const cursorOffset = state.selection.from - from;

  // 1. Remove the mark from the range
  tr.removeMark(from, to, markTypeObj);

  // 2. Insert prefix at start
  tr.insertText(syntax.prefix, from);

  // 3. Insert suffix at end (adjusted for prefix insertion)
  const newSuffixPos = to + syntax.prefix.length;
  tr.insertText(syntax.suffix, newSuffixPos);

  // 4. Set cursor position (adjusted for prefix)
  const newCursorPos = from + syntax.prefix.length + cursorOffset;
  tr.setSelection(TextSelection.create(tr.doc, newCursorPos));

  // 5. Mark this transaction as our own and don't add to history
  tr.setMeta(typoraModeKey, {
    type: "expand",
    expanded: {
      markType,
      from,
      to: to + syntax.prefix.length + syntax.suffix.length,
      prefixLen: syntax.prefix.length,
      suffixLen: syntax.suffix.length,
      text,
    } as ExpandedMark,
  });
  tr.setMeta("addToHistory", false);

  return tr;
}

/**
 * Create a transaction to collapse an expanded mark (hide syntax, re-apply mark).
 */
function createCollapseTransaction(
  state: EditorState,
  expanded: ExpandedMark
): Transaction | null {
  const syntax = MARK_SYNTAX[expanded.markType];
  if (!syntax) return null;

  const { from, prefixLen, suffixLen, markType } = expanded;
  const markTypeObj = state.schema.marks[markType];
  if (!markTypeObj) return null;

  // Validate that the expanded range still makes sense
  const docSize = state.doc.content.size;
  const expectedTo = expanded.to;
  if (from < 0 || expectedTo > docSize || from >= expectedTo) {
    return null;
  }

  // Extract current content in the expanded range
  const currentText = state.doc.textBetween(from, expectedTo);

  // Check if syntax markers are still intact
  const expectedPrefix = syntax.prefix;
  const expectedSuffix = syntax.suffix;

  if (
    !currentText.startsWith(expectedPrefix) ||
    !currentText.endsWith(expectedSuffix)
  ) {
    // User modified the syntax - don't re-apply mark, just clear expanded state
    const tr = state.tr;
    tr.setMeta(typoraModeKey, { type: "clear" });
    tr.setMeta("addToHistory", false);
    return tr;
  }

  // Extract the inner text (without syntax markers)
  const innerText = currentText.slice(prefixLen, -suffixLen || undefined);

  // Create the transaction
  const tr = state.tr;

  // Handle empty inner text case - just delete everything
  if (!innerText) {
    tr.delete(from, expectedTo);
    tr.setSelection(TextSelection.create(tr.doc, from));
    tr.setMeta(typoraModeKey, { type: "collapse" });
    tr.setMeta("addToHistory", false);
    return tr;
  }

  // Calculate where cursor should end up
  const cursorPos = state.selection.from;
  let newCursorPos: number;

  if (cursorPos <= from + prefixLen) {
    // Cursor is in or before prefix - place at start
    newCursorPos = from;
  } else if (cursorPos >= expectedTo - suffixLen) {
    // Cursor is in or after suffix - place at end
    newCursorPos = from + innerText.length;
  } else {
    // Cursor is in the content
    newCursorPos = from + (cursorPos - from - prefixLen);
  }

  // 1. Replace the entire range with just the inner text
  tr.replaceWith(from, expectedTo, state.schema.text(innerText));

  // 2. Apply the mark to the new text
  tr.addMark(from, from + innerText.length, markTypeObj.create());

  // 3. Set cursor position
  newCursorPos = Math.max(from, Math.min(newCursorPos, from + innerText.length));
  tr.setSelection(TextSelection.create(tr.doc, newCursorPos));

  // 4. Mark as our transaction
  tr.setMeta(typoraModeKey, { type: "collapse" });
  tr.setMeta("addToHistory", false);

  return tr;
}

/**
 * Check if cursor is still within the expanded mark range.
 */
function isCursorInExpandedRange(
  state: EditorState,
  expanded: ExpandedMark
): boolean {
  const cursorPos = state.selection.from;
  // Include positions at boundaries (within prefix/suffix)
  return cursorPos >= expanded.from && cursorPos <= expanded.to;
}

/**
 * Compute decorations for block-level elements (headings).
 */
function computeBlockDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];
  const { selection } = state;
  const $from = selection.$from;

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

  return DecorationSet.create(state.doc, decorations);
}

/**
 * Typora Mode Extension
 *
 * Implements true Typora-style editing where inline marks are expanded to show
 * their syntax characters as editable text when the cursor enters them, and
 * collapsed back to marks when the cursor leaves.
 *
 * Headings show their markers as non-editable decorations.
 */
export const TyporaMode = Extension.create({
  name: "typoraMode",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: typoraModeKey,

        state: {
          init(): TyporaModeState {
            return { expanded: null };
          },

          apply(tr, pluginState): TyporaModeState {
            const meta = tr.getMeta(typoraModeKey) as
              | { type: string; expanded?: ExpandedMark }
              | undefined;

            if (meta) {
              if (meta.type === "expand" && meta.expanded) {
                return { expanded: meta.expanded };
              }
              if (meta.type === "collapse" || meta.type === "clear") {
                return { expanded: null };
              }
            }

            // If document changed, try to map the expanded range
            if (tr.docChanged && pluginState.expanded) {
              const { from, to } = pluginState.expanded;
              const newFrom = tr.mapping.map(from);
              const newTo = tr.mapping.map(to);

              return {
                expanded: {
                  ...pluginState.expanded,
                  from: newFrom,
                  to: newTo,
                },
              };
            }

            return pluginState;
          },
        },

        props: {
          decorations(state) {
            // Only compute heading decorations
            try {
              return computeBlockDecorations(state);
            } catch {
              return DecorationSet.empty;
            }
          },
        },

        appendTransaction(transactions, _oldState, newState) {
          // Check if any of our own transactions
          for (const tr of transactions) {
            const meta = tr.getMeta(typoraModeKey);
            if (meta) {
              // This is our own transaction, don't trigger again
              return null;
            }
          }

          // Check if selection changed
          const selectionChanged = transactions.some((tr) => tr.selectionSet);
          if (!selectionChanged && !transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          // Only handle cursor (empty selection)
          if (!newState.selection.empty) {
            // If we have an expanded mark and selection is not empty, collapse it
            const pluginState = typoraModeKey.getState(newState) as
              | TyporaModeState
              | undefined;
            if (pluginState?.expanded) {
              return createCollapseTransaction(newState, pluginState.expanded);
            }
            return null;
          }

          // Get current plugin state
          const pluginState = typoraModeKey.getState(newState) as
            | TyporaModeState
            | undefined;

          if (pluginState?.expanded) {
            // We have an expanded mark - check if cursor is still inside
            if (!isCursorInExpandedRange(newState, pluginState.expanded)) {
              // Cursor left the expanded range - collapse
              return createCollapseTransaction(newState, pluginState.expanded);
            }
            // Cursor still inside - no action needed
            return null;
          }

          // No expanded mark - check if we should expand one
          const markInfo = findMarkAtCursor(newState);
          if (markInfo) {
            return createExpandTransaction(newState, markInfo);
          }

          return null;
        },
      }),
    ];
  },
});
