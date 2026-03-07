import type { Editor } from "@tiptap/core";

export function insertMarkdownLink(editor: Editor): void {
  const { state } = editor;
  const { from, to, empty } = state.selection;

  if (empty) {
    // No selection: insert []() and place cursor inside []
    editor
      .chain()
      .focus()
      .insertContent("[]()")
      .setTextSelection(from + 1) // cursor inside []
      .run();
  } else {
    // Has selection: wrap selected text in [selectedText]() and place cursor inside ()
    const selectedText = state.doc.textBetween(from, to);
    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent(`[${selectedText}]()`)
      .setTextSelection(from + selectedText.length + 3) // cursor inside ()
      .run();
  }
}

export function insertMarkdownImage(editor: Editor): void {
  const { state } = editor;
  const { from, to, empty } = state.selection;

  if (empty) {
    // No selection: insert ![]() and place cursor inside []
    editor
      .chain()
      .focus()
      .insertContent("![]()")
      .setTextSelection(from + 2) // cursor inside [] for alt text
      .run();
  } else {
    // Has selection: use selected text as alt text
    const selectedText = state.doc.textBetween(from, to);
    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent(`![${selectedText}]()`)
      .setTextSelection(from + selectedText.length + 4) // cursor inside ()
      .run();
  }
}
