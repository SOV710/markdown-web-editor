import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import {
  RowsPlusTop,
  RowsPlusBottom,
  ColumnsPlusLeft,
  ColumnsPlusRight,
  Trash,
} from "@phosphor-icons/react";
import styles from "./Editor.module.css";

const TABLE_ICON_SIZE = 14;

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
        <RowsPlusTop size={TABLE_ICON_SIZE} /> Row
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row after"
      >
        <RowsPlusBottom size={TABLE_ICON_SIZE} /> Row
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
      >
        <Trash size={TABLE_ICON_SIZE} /> Row
      </button>
      <span className={styles.tableMenuDivider} />
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column before"
      >
        <ColumnsPlusLeft size={TABLE_ICON_SIZE} /> Col
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column after"
      >
        <ColumnsPlusRight size={TABLE_ICON_SIZE} /> Col
      </button>
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
      >
        <Trash size={TABLE_ICON_SIZE} /> Col
      </button>
      <span className={styles.tableMenuDivider} />
      <button
        type="button"
        className={styles.tableMenuBtn}
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
      >
        <Trash size={TABLE_ICON_SIZE} /> Table
      </button>
    </BubbleMenu>
  );
}
