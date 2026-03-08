import { useState, useCallback, useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { MarkdownStorage } from "tiptap-markdown";
import { useMarkdownEditor } from "@/lib/use-markdown-editor";
import type { UseMarkdownEditorOptions } from "@/lib/use-markdown-editor";
import { TableMenu } from "./TableMenu";
import { ContextMenu } from "./ContextMenu";
import { SourceEditor } from "./SourceEditor";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import styles from "./Editor.module.css";
import "@/styles/editor.css";
import "@/styles/hljs.css";
import "@/styles/katex.css";

export interface EditorProps extends UseMarkdownEditorOptions {
  className?: string;
}

export function Editor({ className, ...editorOptions }: EditorProps) {
  const editor = useMarkdownEditor(editorOptions);
  const [viewMode, setViewMode] = useState<ViewMode>("richtext");
  const [markdownSource, setMarkdownSource] = useState("");

  // Sync markdown source when switching views
  // NOTE: CommonMark collapses multiple consecutive blank lines into one.
  // This is by-design per the CommonMark spec. Extra blank lines typed in
  // source mode will be reduced to single blank lines after switching views.
  // Single blank lines (paragraph separators) ARE preserved correctly.
  const handleModeChange = useCallback(
    (newMode: ViewMode) => {
      if (!editor) return;

      if (newMode === "source") {
        // Serialize TipTap doc → Markdown directly from ProseMirror doc
        const storage = editor.storage as unknown as { markdown: MarkdownStorage };
        const markdown = storage.markdown.getMarkdown();
        setMarkdownSource(markdown);
      } else {
        // Parse Markdown → TipTap doc directly via tiptap-markdown
        // setContent accepts Markdown strings when the Markdown extension is active
        editor.commands.setContent(markdownSource);
      }

      setViewMode(newMode);
    },
    [editor, markdownSource]
  );

  // Keyboard shortcut for view mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+M: toggle view mode
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        handleModeChange(viewMode === "richtext" ? "source" : "richtext");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, handleModeChange]);

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <div className={styles.toolbarRow}>
        <ViewToggle mode={viewMode} onModeChange={handleModeChange} />
      </div>

      {viewMode === "richtext" ? (
        <div className={styles.editorArea}>
          <EditorContent editor={editor} />
          {editor && <TableMenu editor={editor} />}
          {editor && (
            <DragHandle editor={editor} className={styles.dragHandle}>
              <DotsSixVertical size={16} weight="bold" />
            </DragHandle>
          )}
        </div>
      ) : (
        <SourceEditor
          value={markdownSource}
          onChange={setMarkdownSource}
          className={styles.editorArea}
        />
      )}

      {/* Render outside .editorArea to avoid React/ProseMirror DOM conflicts */}
      {editor && viewMode === "richtext" && <ContextMenu editor={editor} />}
    </div>
  );
}
