import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
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
  VideoCamera,
  Table,
  CodeBlock,
  MathOperations,
  Minus,
  Scissors,
  Copy,
  ClipboardText,
} from "@phosphor-icons/react";
import { findWordAtPosition } from "@/lib/word-segmentation";
import { insertMarkdownLink, insertMarkdownImage, insertMarkdownVideo } from "@/lib/link-utils";
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
  const [clickPosition, setClickPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [measured, setMeasured] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setMeasured(false);
  }, []);

  // Handle right-click
  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (event: MouseEvent) => {
      try {
        // Safety check: ensure editor view and DOM are available
        if (!editor.view || !editor.view.dom) return;

        const editorElement = editor.view.dom;
        if (!editorElement.contains(event.target as Node)) return;

        event.preventDefault();

        // Store the click position - adjustment happens in useLayoutEffect
        setClickPosition({ x: event.clientX, y: event.clientY });
        setAdjustedPosition({ x: event.clientX, y: event.clientY });
        setMeasured(false);
        setIsOpen(true);
      } catch (error) {
        console.error("ContextMenu handleContextMenu error:", error);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [editor]);

  // Measure and adjust position after render
  useLayoutEffect(() => {
    if (!isOpen || measured || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    let x = clickPosition.x;
    let y = clickPosition.y;

    // Flip left if would overflow right edge
    if (x + rect.width + padding > window.innerWidth) {
      x = clickPosition.x - rect.width;
    }

    // Flip up if would overflow bottom edge
    if (y + rect.height + padding > window.innerHeight) {
      y = clickPosition.y - rect.height;
    }

    // Ensure menu stays within viewport bounds
    x = Math.max(padding, Math.min(x, window.innerWidth - rect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - rect.height - padding));

    setAdjustedPosition({ x, y });
    setMeasured(true);
  }, [isOpen, measured, clickPosition]);

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

  // Early return if not ready
  if (!editor || !isOpen) return null;

  const safeIsActive = (name: string): boolean => {
    try {
      return editor.isActive(name);
    } catch {
      return false;
    }
  };

  /**
   * Expand selection to word if no selection exists.
   * Uses Intl.Segmenter for proper Chinese/CJK word boundary detection.
   */
  const expandSelectionToWord = (): boolean => {
    try {
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
    } catch (error) {
      console.error("expandSelectionToWord error:", error);
      return false;
    }
  };

  /**
   * Create a formatting action that expands selection to word first if needed.
   */
  const createFormatAction = (
    formatFn: (ed: Editor) => ReturnType<Editor["chain"]>
  ) => {
    return () => {
      try {
        if (!editor) return;
        expandSelectionToWord();
        formatFn(editor).run();
      } catch (error) {
        console.error("Format action error:", error);
      }
    };
  };

  const handleAction = (action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error("Menu action error:", error);
    }
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
        isActive: safeIsActive("bold"),
      },
      {
        icon: <TextItalic size={16} weight="bold" />,
        label: "Italic",
        shortcut: "Ctrl+I",
        action: createFormatAction((ed) => ed.chain().focus().toggleItalic()),
        isActive: safeIsActive("italic"),
      },
      {
        icon: <TextUnderline size={16} weight="bold" />,
        label: "Underline",
        shortcut: "Ctrl+U",
        action: createFormatAction((ed) =>
          ed.chain().focus().toggleUnderline()
        ),
        isActive: safeIsActive("underline"),
      },
      {
        icon: <TextStrikethrough size={16} weight="bold" />,
        label: "Strikethrough",
        action: createFormatAction((ed) => ed.chain().focus().toggleStrike()),
        isActive: safeIsActive("strike"),
      },
      {
        icon: <Highlighter size={16} weight="bold" />,
        label: "Highlight",
        shortcut: "Ctrl+Shift+H",
        action: createFormatAction((ed) =>
          ed.chain().focus().toggleHighlight()
        ),
        isActive: safeIsActive("highlight"),
      },
      {
        icon: <Code size={16} weight="bold" />,
        label: "Inline Code",
        action: createFormatAction((ed) => ed.chain().focus().toggleCode()),
        isActive: safeIsActive("code"),
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
        action: () => insertMarkdownLink(editor),
      },
      {
        icon: <Image size={16} weight="bold" />,
        label: "Image",
        action: () => insertMarkdownImage(editor),
      },
      {
        icon: <VideoCamera size={16} weight="bold" />,
        label: "Video",
        action: () => insertMarkdownVideo(editor),
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

  /**
   * Copy selected content to clipboard using modern API with fallback.
   */
  const copyToClipboard = async () => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;

    if (selection.empty) return;

    // Get selected text
    const selectedText = state.doc.textBetween(selection.from, selection.to, " ");

    try {
      // Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selectedText);
      } else {
        // Fallback to execCommand
        document.execCommand("copy");
      }
    } catch {
      // Fallback to execCommand
      document.execCommand("copy");
    }
  };

  /**
   * Cut selected content (copy then delete).
   */
  const cutToClipboard = async () => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;

    if (selection.empty) return;

    // Copy first
    await copyToClipboard();

    // Then delete selection
    editor.chain().focus().deleteSelection().run();
  };

  /**
   * Paste from clipboard.
   */
  const pasteFromClipboard = async () => {
    if (!editor) return;

    try {
      // Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          editor.chain().focus().insertContent(text).run();
          return;
        }
      }
    } catch {
      // Clipboard API may fail due to permissions
    }

    // Fallback: use execCommand (may not work in all browsers)
    document.execCommand("paste");
  };

  const clipboardSection: MenuSection = {
    title: "Clipboard",
    items: [
      {
        icon: <Scissors size={16} weight="bold" />,
        label: "Cut",
        shortcut: "Ctrl+X",
        action: () => {
          cutToClipboard();
        },
      },
      {
        icon: <Copy size={16} weight="bold" />,
        label: "Copy",
        shortcut: "Ctrl+C",
        action: () => {
          copyToClipboard();
        },
      },
      {
        icon: <ClipboardText size={16} weight="bold" />,
        label: "Paste",
        shortcut: "Ctrl+V",
        action: () => {
          pasteFromClipboard();
        },
      },
    ],
  };

  const sections = [formatSection, insertSection, clipboardSection];

  // Use portal to render outside ProseMirror DOM tree, avoiding React/ProseMirror conflicts
  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        visibility: measured ? "visible" : "hidden",
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
    </div>,
    document.body
  );
}
