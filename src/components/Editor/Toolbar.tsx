import type { Editor } from "@tiptap/react";
import styles from "./Editor.module.css";

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, active, title, children }: ToolbarBtnProps) {
  return (
    <button
      className={styles.toolbarBtn}
      onClick={onClick}
      data-active={active}
      title={title}
      type="button"
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

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className={styles.toolbar}>
      {/* ── Headings ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1 (Ctrl+Alt+1)"
      >
        H1
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2 (Ctrl+Alt+2)"
      >
        H2
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3 (Ctrl+Alt+3)"
      >
        H3
      </ToolbarBtn>

      <Divider />

      {/* ── Inline marks ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        B
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        I
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <span style={{ textDecoration: "underline" }}>U</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        S
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code (Ctrl+E)"
      >
        {"<>"}
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => handleLinkClick(editor)}
        active={editor.isActive("link")}
        title="Link"
      >
        {"🔗"}
      </ToolbarBtn>

      <Divider />

      {/* ── Block elements ── */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        •
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered list"
      >
        1.
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        title="Task list"
      >
        {"[ ]"}
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        "
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code block"
      >
        {"{ }"}
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        ―
      </ToolbarBtn>
    </div>
  );
}
