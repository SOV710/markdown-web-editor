import { useEffect, useRef, useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Highlighter,
  Code,
  Link,
  Image,
  Table,
  CodeBlock,
  MathOperations,
  Minus,
  Scissors,
  Copy,
  ClipboardText,
} from "@phosphor-icons/react";
import styles from "./ContextMenu.module.css";

export interface ContextMenuProps {
  editor: Editor | null;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  isActive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function ContextMenu({ editor }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle right-click
  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (event: MouseEvent) => {
      const editorElement = editor.view.dom;
      if (!editorElement.contains(event.target as Node)) return;

      event.preventDefault();

      // Calculate position within viewport
      const menuWidth = 200;
      const menuHeight = 380;
      const padding = 8;

      let x = event.clientX;
      let y = event.clientY;

      // Adjust if menu would overflow right edge
      if (x + menuWidth + padding > window.innerWidth) {
        x = window.innerWidth - menuWidth - padding;
      }

      // Adjust if menu would overflow bottom edge
      if (y + menuHeight + padding > window.innerHeight) {
        y = window.innerHeight - menuHeight - padding;
      }

      setPosition({ x, y });
      setIsOpen(true);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [editor]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  if (!editor || !isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const formatSection: MenuSection = {
    title: "Format",
    items: [
      {
        icon: <TextB size={16} weight="bold" />,
        label: "Bold",
        shortcut: "Ctrl+B",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive("bold"),
      },
      {
        icon: <TextItalic size={16} weight="bold" />,
        label: "Italic",
        shortcut: "Ctrl+I",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive("italic"),
      },
      {
        icon: <TextUnderline size={16} weight="bold" />,
        label: "Underline",
        shortcut: "Ctrl+U",
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive("underline"),
      },
      {
        icon: <TextStrikethrough size={16} weight="bold" />,
        label: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive("strike"),
      },
      {
        icon: <Highlighter size={16} weight="bold" />,
        label: "Highlight",
        shortcut: "Ctrl+Shift+H",
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: editor.isActive("highlight"),
      },
      {
        icon: <Code size={16} weight="bold" />,
        label: "Inline Code",
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive("code"),
      },
    ],
  };

  const insertSection: MenuSection = {
    title: "Insert",
    items: [
      {
        icon: <Link size={16} weight="bold" />,
        label: "Link",
        shortcut: "Ctrl+K",
        action: () => {
          // Will be implemented in Task 7
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
      },
      {
        icon: <Image size={16} weight="bold" />,
        label: "Image",
        action: () => {
          const url = window.prompt("Enter image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        },
      },
      {
        icon: <Table size={16} weight="bold" />,
        label: "Table",
        action: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
      {
        icon: <CodeBlock size={16} weight="bold" />,
        label: "Code Block",
        action: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        icon: <MathOperations size={16} weight="bold" />,
        label: "Math Block",
        action: () => editor.chain().focus().setMathBlock({ latex: "" }).run(),
      },
      {
        icon: <Minus size={16} weight="bold" />,
        label: "Divider",
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
  };

  const clipboardSection: MenuSection = {
    title: "Clipboard",
    items: [
      {
        icon: <Scissors size={16} weight="bold" />,
        label: "Cut",
        shortcut: "Ctrl+X",
        action: () => {
          document.execCommand("cut");
        },
      },
      {
        icon: <Copy size={16} weight="bold" />,
        label: "Copy",
        shortcut: "Ctrl+C",
        action: () => {
          document.execCommand("copy");
        },
      },
      {
        icon: <ClipboardText size={16} weight="bold" />,
        label: "Paste",
        shortcut: "Ctrl+V",
        action: () => {
          document.execCommand("paste");
        },
      },
    ],
  };

  const sections = [formatSection, insertSection, clipboardSection];

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className={styles.section}>
          <div className={styles.sectionTitle}>{section.title}</div>
          {section.items.map((item) => (
            <button
              key={item.label}
              className={styles.menuItem}
              data-active={item.isActive}
              onClick={() => handleAction(item.action)}
            >
              <span className={styles.menuItemIcon}>{item.icon}</span>
              <span className={styles.menuItemLabel}>{item.label}</span>
              {item.shortcut && (
                <span className={styles.menuItemShortcut}>{item.shortcut}</span>
              )}
            </button>
          ))}
          {sectionIndex < sections.length - 1 && (
            <div className={styles.divider} />
          )}
        </div>
      ))}
    </div>
  );
}
