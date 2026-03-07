import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Code,
  Link,
} from "@phosphor-icons/react";
import { ICON_SIZE_SM } from "./icons";
import styles from "./BubbleToolbar.module.css";

interface BubbleToolbarProps {
  editor: Editor;
}

interface BubbleButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function BubbleButton({ onClick, active, title, children }: BubbleButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      data-active={active}
      title={title}
    >
      {children}
    </button>
  );
}

function handleLinkClick(editor: Editor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
  } else {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, from, to }: { editor: Editor; from: number; to: number }) => {
        // Don't show for empty selection
        if (from === to) return false;

        // Don't show for code blocks
        if (e.isActive("codeBlock")) return false;

        // Don't show for images
        if (e.isActive("image")) return false;

        // Don't show for math blocks
        if (e.isActive("mathBlock")) return false;

        // Don't show for plantuml blocks
        if (e.isActive("plantumlBlock")) return false;

        // Don't show for video blocks
        if (e.isActive("videoBlock")) return false;

        return true;
      }}
      className={styles.container}
    >
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <TextB size={ICON_SIZE_SM} />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <TextItalic size={ICON_SIZE_SM} />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <TextUnderline size={ICON_SIZE_SM} />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <TextStrikethrough size={ICON_SIZE_SM} />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Code"
      >
        <Code size={ICON_SIZE_SM} />
      </BubbleButton>
      <BubbleButton
        onClick={() => handleLinkClick(editor)}
        active={editor.isActive("link")}
        title="Link"
      >
        <Link size={ICON_SIZE_SM} />
      </BubbleButton>
    </BubbleMenu>
  );
}
