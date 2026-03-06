import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import styles from "./Editor.module.css";

interface TableMenuProps {
  editor: Editor;
}

export function TableMenu({ editor }: TableMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }: { editor: Editor }) => e.isActive("table")}
      className={styles.tableMenu}
    >
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add row before"
      >
        ↑ Row
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row after"
      >
        ↓ Row
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
      >
        ✕ Row
      </button>
      <span className={styles.tableMenuDivider} />
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column before"
      >
        ← Col
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column after"
      >
        → Col
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
      >
        ✕ Col
      </button>
      <span className={styles.tableMenuDivider} />
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
      >
        ✕ Table
      </button>
    </BubbleMenu>
  );
}
