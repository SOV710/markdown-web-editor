import type { Editor } from "@tiptap/react";
import {
  TextHOne,
  TextHTwo,
  TextHThree,
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Code,
  Link,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  CodeBlock,
  Minus,
  Image,
  Table,
  VideoCamera,
} from "@phosphor-icons/react";
import { ICON_SIZE } from "./icons";
import styles from "./Editor.module.css";

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarBtn({ onClick, active, title, children, disabled }: ToolbarBtnProps) {
  return (
    <button
      className={styles.toolbarBtn}
      onClick={onClick}
      data-active={active}
      title={title}
      type="button"
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className={styles.divider} />;
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

function handleImageClick(editor: Editor) {
  const url = window.prompt("Image URL:");
  if (url) {
    editor.chain().focus().setImage({ src: url }).run();
  }
}

function handleVideoClick(editor: Editor) {
  const url = window.prompt("Video URL:");
  if (url) {
    editor.commands.insertContent({
      type: "videoBlock",
      attrs: { src: url },
    });
  }
}

export function Toolbar({ editor, disabled }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className={styles.toolbar}>
      {/* ── Headings ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1 (Ctrl+Alt+1)"
        disabled={disabled}
      >
        <TextHOne size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2 (Ctrl+Alt+2)"
        disabled={disabled}
      >
        <TextHTwo size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3 (Ctrl+Alt+3)"
        disabled={disabled}
      >
        <TextHThree size={ICON_SIZE} />
      </ToolbarBtn>

      <Divider />

      {/* ── Inline marks ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
        disabled={disabled}
      >
        <TextB size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
        disabled={disabled}
      >
        <TextItalic size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
        disabled={disabled}
      >
        <TextUnderline size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough (Ctrl+Shift+S)"
        disabled={disabled}
      >
        <TextStrikethrough size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code (Ctrl+E)"
        disabled={disabled}
      >
        <Code size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => handleLinkClick(editor)}
        active={editor.isActive("link")}
        title="Link"
        disabled={disabled}
      >
        <Link size={ICON_SIZE} />
      </ToolbarBtn>

      <Divider />

      {/* ── Block elements ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
        disabled={disabled}
      >
        <ListBullets size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered list"
        disabled={disabled}
      >
        <ListNumbers size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        title="Task list"
        disabled={disabled}
      >
        <CheckSquare size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
        disabled={disabled}
      >
        <Quotes size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code block"
        disabled={disabled}
      >
        <CodeBlock size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
        disabled={disabled}
      >
        <Minus size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => handleImageClick(editor)}
        title="Image"
        disabled={disabled}
      >
        <Image size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert table"
        disabled={disabled}
      >
        <Table size={ICON_SIZE} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => handleVideoClick(editor)}
        title="Insert video"
        disabled={disabled}
      >
        <VideoCamera size={ICON_SIZE} />
      </ToolbarBtn>
    </div>
  );
}
