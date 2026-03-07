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
import { findWordAtPosition } from "@/lib/word-segmentation";
import styles from "./ContextMenu.module.css";

export interface ContextMenuProps {
  editor: Editor | null;
  onOpenLinkInput?: () => void;
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

export function ContextMenu({ editor, onOpenLinkInput }: ContextMenuProps) {
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

  /**
   * Expand selection to word if no selection exists.
   * Uses Intl.Segmenter for proper Chinese/CJK word boundary detection.
   */
  const expandSelectionToWord = (): boolean => {
    const { state } = editor;
    const { selection } = state;

    // If there's already a selection, don't expand
    if (!selection.empty) {
      return true;
    }

    // Get the text node at cursor position
    const { $from } = selection;
    const textNode = $from.parent;

    if (!textNode.isTextblock) {
      return false;
    }

    // Get the text content and cursor position within the node
    const text = textNode.textContent;
    const cursorInNode = $from.parentOffset;

    // Find word at cursor position
    const wordBoundary = findWordAtPosition(text, cursorInNode);

    if (!wordBoundary) {
      return false;
    }

    // Calculate absolute positions
    const nodeStart = $from.start();
    const wordStart = nodeStart + wordBoundary.start;
    const wordEnd = nodeStart + wordBoundary.end;

    // Set selection to the word
    editor
      .chain()
      .setTextSelection({ from: wordStart, to: wordEnd })
      .run();

    return true;
  };

  /**
   * Create a formatting action that expands selection to word first if needed.
   */
  const createFormatAction = (
    formatFn: (ed: Editor) => ReturnType<Editor["chain"]>
  ) => {
    return () => {
      if (!editor) return;
      expandSelectionToWord();
      formatFn(editor).run();
    };
  };

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
        action: createFormatAction((ed) => ed.chain().focus().toggleBold()),
        isActive: editor.isActive("bold"),
      },
      {
        icon: <TextItalic size={16} weight="bold" />,
        label: "Italic",
        shortcut: "Ctrl+I",
        action: createFormatAction((ed) => ed.chain().focus().toggleItalic()),
        isActive: editor.isActive("italic"),
      },
      {
        icon: <TextUnderline size={16} weight="bold" />,
        label: "Underline",
        shortcut: "Ctrl+U",
        action: createFormatAction((ed) =>
          ed.chain().focus().toggleUnderline()
        ),
        isActive: editor.isActive("underline"),
      },
      {
        icon: <TextStrikethrough size={16} weight="bold" />,
        label: "Strikethrough",
        action: createFormatAction((ed) => ed.chain().focus().toggleStrike()),
        isActive: editor.isActive("strike"),
      },
      {
        icon: <Highlighter size={16} weight="bold" />,
        label: "Highlight",
        shortcut: "Ctrl+Shift+H",
        action: createFormatAction((ed) =>
          ed.chain().focus().toggleHighlight()
        ),
        isActive: editor.isActive("highlight"),
      },
      {
        icon: <Code size={16} weight="bold" />,
        label: "Inline Code",
        action: createFormatAction((ed) => ed.chain().focus().toggleCode()),
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
          onOpenLinkInput?.();
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
