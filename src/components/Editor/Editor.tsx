import { useState, useCallback, useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import type { MarkdownStorage } from "tiptap-markdown";
import { useMarkdownEditor } from "@/lib/use-markdown-editor";
import type { UseMarkdownEditorOptions } from "@/lib/use-markdown-editor";
import { Toolbar } from "./Toolbar";
import { TableMenu } from "./TableMenu";
import { BubbleToolbar } from "./BubbleToolbar";
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

  // Update markdown source from external changes (keyboard shortcut)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        <Toolbar editor={editor} disabled={viewMode === "source"} />
        <ViewToggle mode={viewMode} onModeChange={handleModeChange} />
      </div>

      {viewMode === "richtext" ? (
        <div className={styles.editorArea}>
          <EditorContent editor={editor} />
          {editor && <TableMenu editor={editor} />}
          {editor && <BubbleToolbar editor={editor} />}
          {editor && (
            <DragHandle editor={editor} className={styles.dragHandle}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="5" cy="4" r="1.5" />
                <circle cx="11" cy="4" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="11" cy="12" r="1.5" />
              </svg>
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
    </div>
  );
}
