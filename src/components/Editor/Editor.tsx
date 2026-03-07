import { EditorContent } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { useMarkdownEditor } from "@/lib/use-markdown-editor";
import type { UseMarkdownEditorOptions } from "@/lib/use-markdown-editor";
import { Toolbar } from "./Toolbar";
import { TableMenu } from "./TableMenu";
import { BubbleToolbar } from "./BubbleToolbar";
import styles from "./Editor.module.css";
import "@/styles/editor.css";
import "@/styles/hljs.css";
import "@/styles/katex.css";

export interface EditorProps extends UseMarkdownEditorOptions {
  className?: string;
}

export function Editor({ className, ...editorOptions }: EditorProps) {
  const editor = useMarkdownEditor(editorOptions);

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <Toolbar editor={editor} />
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
    </div>
  );
}
