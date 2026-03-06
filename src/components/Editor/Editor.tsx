import { EditorContent } from "@tiptap/react";
import { useMarkdownEditor } from "@/lib/use-markdown-editor";
import type { UseMarkdownEditorOptions } from "@/lib/use-markdown-editor";
import { Toolbar } from "./Toolbar";
import { TableMenu } from "./TableMenu";
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
      </div>
    </div>
  );
}
