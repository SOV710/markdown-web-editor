import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { findWordAtPosition } from "@/lib/word-segmentation";
import { insertMarkdownLink, insertMarkdownImage, insertMarkdownVideo } from "@/lib/link-utils";
import styles from "./ContextMenu.module.css";

export interface ContextMenuProps {
  editor: Editor | null;
}

interface Position {
  x: number;
  y: number;
}

type MenuItemType =
  | {
      kind: "action";
      label: string;
      shortcut?: string;
      action: () => void;
      disabled?: boolean;
      checked?: boolean;
    }
  | { kind: "submenu"; label: string; children: MenuItemType[] }
  | { kind: "separator" };

interface MenuPanelProps {
  items: MenuItemType[];
  position: Position;       // Only used for root menu
  onClose: () => void;
  isSubmenu?: boolean;
}

function MenuPanel({ items, position, onClose, isSubmenu = false }: MenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<Position>(position);
  const [measured, setMeasured] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);

  // Measure and adjust position
  useLayoutEffect(() => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const padding = 8;
    let x: number;
    let y: number;

    if (isSubmenu) {
      // The submenu panel is inside a .submenuWrapper div.
      // The trigger button is the sibling button within the wrapper.
      // The parent panel is the grandparent .panel element.
      const wrapper = panelRef.current.parentElement; // .submenuWrapper
      const triggerButton = wrapper?.querySelector("button");
      const parentPanel = wrapper?.closest(`.${styles.panel}`);

      if (triggerButton && parentPanel) {
        const triggerRect = triggerButton.getBoundingClientRect();
        const parentRect = parentPanel.getBoundingClientRect();

        // X: flush to right edge of parent panel
        x = parentRect.right - 2;
        if (x + rect.width + padding > window.innerWidth) {
          x = parentRect.left - rect.width + 2;
        }

        // Y: top-aligned with trigger button
        y = triggerRect.top;
        if (y + rect.height + padding > window.innerHeight) {
          y = triggerRect.bottom - rect.height;
        }

        y = Math.max(padding, Math.min(y, window.innerHeight - rect.height - padding));
      } else {
        // Fallback: position near click
        x = position.x;
        y = position.y;
      }

      x = Math.max(padding, Math.min(x, window.innerWidth - rect.width - padding));
    } else {
      // Root menu positioning
      x = position.x;
      y = position.y;

      if (x + rect.width + padding > window.innerWidth) {
        x = position.x - rect.width;
      }
      if (y + rect.height + padding > window.innerHeight) {
        y = position.y - rect.height;
      }

      x = Math.max(padding, Math.min(x, window.innerWidth - rect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - rect.height - padding));
    }

    setAdjustedPosition({ x, y });
    setMeasured(true);
  }, [position, isSubmenu]);

  // Keyboard navigation
  useEffect(() => {
    if (isSubmenu) return; // Only handle keyboard on root menu

    const handleKeyDown = (e: KeyboardEvent) => {
      const actionableIndices = items
        .map((item, i) => (item.kind !== "separator" ? i : -1))
        .filter(i => i !== -1);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentActionableIndex = actionableIndices.indexOf(focusedIndex);
        const nextIndex = actionableIndices[(currentActionableIndex + 1) % actionableIndices.length];
        setFocusedIndex(nextIndex ?? actionableIndices[0] ?? -1);
        setOpenSubmenuIndex(null);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentActionableIndex = actionableIndices.indexOf(focusedIndex);
        const prevIndex = actionableIndices[(currentActionableIndex - 1 + actionableIndices.length) % actionableIndices.length];
        setFocusedIndex(prevIndex ?? actionableIndices[actionableIndices.length - 1] ?? -1);
        setOpenSubmenuIndex(null);
      } else if (e.key === "ArrowRight") {
        const item = items[focusedIndex];
        if (item?.kind === "submenu") {
          setOpenSubmenuIndex(focusedIndex);
        }
      } else if (e.key === "ArrowLeft") {
        setOpenSubmenuIndex(null);
      } else if (e.key === "Enter") {
        const item = items[focusedIndex];
        if (item?.kind === "action" && !item.disabled) {
          item.action();
          onClose();
        } else if (item?.kind === "submenu") {
          setOpenSubmenuIndex(focusedIndex);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, focusedIndex, onClose, isSubmenu]);

  const handleMouseEnter = (index: number) => {
    setFocusedIndex(index);
    const item = items[index];

    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }

    if (item?.kind === "submenu") {
      submenuTimeoutRef.current = setTimeout(() => {
        setOpenSubmenuIndex(index);
      }, 150);
    } else {
      setOpenSubmenuIndex(null);
    }
  };

  const handleMouseLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  };

  const handleItemClick = (item: MenuItemType) => {
    if (item.kind === "action" && !item.disabled) {
      item.action();
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        visibility: measured ? "visible" : "hidden",
      }}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item, index) => {
        if (item.kind === "separator") {
          return <div key={`sep-${index}`} className={styles.separator} />;
        }

        if (item.kind === "submenu") {
          const isOpen = openSubmenuIndex === index;
          return (
            <div key={item.label} className={styles.submenuWrapper}>
              <button
                ref={el => { itemRefs.current[index] = el; }}
                className={styles.item}
                data-focused={focusedIndex === index}
                onMouseEnter={() => handleMouseEnter(index)}
              >
                <span className={styles.itemCheck}></span>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemArrow}>▸</span>
              </button>
              {isOpen && (
                <MenuPanel
                  items={item.children}
                  position={{ x: 0, y: 0 }}
                  onClose={onClose}
                  isSubmenu
                />
              )}
            </div>
          );
        }

        // action item
        return (
          <button
            key={item.label}
            ref={el => { itemRefs.current[index] = el; }}
            className={`${styles.item} ${item.disabled ? styles.disabled : ""}`}
            data-focused={focusedIndex === index}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
          >
            <span className={styles.itemCheck}>{item.checked ? "✓" : ""}</span>
            <span className={styles.itemLabel}>{item.label}</span>
            {item.shortcut && <span className={styles.itemShortcut}>{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ContextMenu({ editor }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<Position>({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle right-click
  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (event: MouseEvent) => {
      try {
        if (!editor.view || !editor.view.dom) return;

        const editorElement = editor.view.dom;
        if (!editorElement.contains(event.target as Node)) return;

        event.preventDefault();

        const { state } = editor;
        const { selection } = state;
        const isEmpty = selection.empty;
        const text = isEmpty ? "" : state.doc.textBetween(selection.from, selection.to, " ");

        setHasSelection(!isEmpty);
        setSelectedText(text);
        setClickPosition({ x: event.clientX, y: event.clientY });
        setIsOpen(true);
      } catch (error) {
        console.error("ContextMenu handleContextMenu error:", error);
      }
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeMenu]);

  if (!editor || !isOpen) return null;

  // Helper functions
  const safeIsActive = (name: string, attrs?: Record<string, unknown>): boolean => {
    try {
      return editor.isActive(name, attrs);
    } catch {
      return false;
    }
  };

  const expandSelectionToWord = (): boolean => {
    try {
      const { state } = editor;
      const { selection } = state;

      if (!selection.empty) return true;

      const { $from } = selection;
      const textNode = $from.parent;

      if (!textNode.isTextblock) return false;

      const text = textNode.textContent;
      const cursorInNode = $from.parentOffset;
      const wordBoundary = findWordAtPosition(text, cursorInNode);

      if (!wordBoundary) return false;

      const nodeStart = $from.start();
      const wordStart = nodeStart + wordBoundary.start;
      const wordEnd = nodeStart + wordBoundary.end;

      editor.chain().setTextSelection({ from: wordStart, to: wordEnd }).run();
      return true;
    } catch {
      return false;
    }
  };

  const createFormatAction = (formatFn: (ed: Editor) => ReturnType<Editor["chain"]>) => {
    return () => {
      expandSelectionToWord();
      formatFn(editor).run();
    };
  };

  // Clipboard operations
  const copyToClipboard = async () => {
    const { state } = editor;
    const { selection } = state;
    if (selection.empty) return;

    const text = state.doc.textBetween(selection.from, selection.to, " ");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        document.execCommand("copy");
      }
    } catch {
      document.execCommand("copy");
    }
  };

  const cutToClipboard = async () => {
    await copyToClipboard();
    editor.chain().focus().deleteSelection().run();
  };

  const pasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          editor.chain().focus().insertContent(text).run();
          return;
        }
      }
    } catch {
      // Ignore
    }
    document.execCommand("paste");
  };

  const pasteAsPlainText = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        if (text) {
          editor.chain().focus().insertContent({ type: "text", text }).run();
        }
      }
    } catch {
      // Ignore
    }
  };

  // Wrap selection in math inline
  const wrapInMath = () => {
    expandSelectionToWord();
    const { state } = editor;
    const { from, to, empty } = state.selection;

    if (empty) {
      editor.chain().focus().insertContent({ type: "text", text: "$$" }).setTextSelection(from + 1).run();
    } else {
      const text = state.doc.textBetween(from, to);
      editor.chain().focus().deleteSelection().insertContent({ type: "text", text: `$${text}$` }).run();
    }
  };

  // Build menu structure
  const truncatedText = selectedText.length > 20 ? selectedText.slice(0, 20) + "…" : selectedText;

  const formatSubmenu: MenuItemType[] = [
    { kind: "action", label: "Bold", shortcut: "Ctrl+B", action: createFormatAction(ed => ed.chain().focus().toggleBold()), checked: safeIsActive("bold") },
    { kind: "action", label: "Italic", shortcut: "Ctrl+I", action: createFormatAction(ed => ed.chain().focus().toggleItalic()), checked: safeIsActive("italic") },
    { kind: "action", label: "Strikethrough", shortcut: "Ctrl+Shift+S", action: createFormatAction(ed => ed.chain().focus().toggleStrike()), checked: safeIsActive("strike") },
    { kind: "action", label: "Highlight", shortcut: "Ctrl+Shift+H", action: createFormatAction(ed => ed.chain().focus().toggleHighlight()), checked: safeIsActive("highlight") },
    { kind: "separator" },
    { kind: "action", label: "Code", shortcut: "Ctrl+E", action: createFormatAction(ed => ed.chain().focus().toggleCode()), checked: safeIsActive("code") },
    { kind: "action", label: "Math", action: wrapInMath, checked: false },
    { kind: "separator" },
    { kind: "action", label: "Clear formatting", action: () => editor.chain().focus().unsetAllMarks().run() },
  ];

  const paragraphSubmenu: MenuItemType[] = [
    { kind: "action", label: "Bullet list", action: () => editor.chain().focus().toggleBulletList().run(), checked: safeIsActive("bulletList") },
    { kind: "action", label: "Numbered list", action: () => editor.chain().focus().toggleOrderedList().run(), checked: safeIsActive("orderedList") },
    { kind: "action", label: "Task list", action: () => editor.chain().focus().toggleTaskList().run(), checked: safeIsActive("taskList") },
    { kind: "separator" },
    { kind: "action", label: "Heading 1", shortcut: "Ctrl+Alt+1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), checked: safeIsActive("heading", { level: 1 }) },
    { kind: "action", label: "Heading 2", shortcut: "Ctrl+Alt+2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), checked: safeIsActive("heading", { level: 2 }) },
    { kind: "action", label: "Heading 3", shortcut: "Ctrl+Alt+3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), checked: safeIsActive("heading", { level: 3 }) },
    { kind: "action", label: "Heading 4", shortcut: "Ctrl+Alt+4", action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), checked: safeIsActive("heading", { level: 4 }) },
    { kind: "action", label: "Heading 5", shortcut: "Ctrl+Alt+5", action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(), checked: safeIsActive("heading", { level: 5 }) },
    { kind: "action", label: "Heading 6", shortcut: "Ctrl+Alt+6", action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(), checked: safeIsActive("heading", { level: 6 }) },
    { kind: "action", label: "Body", shortcut: "Ctrl+Alt+0", action: () => editor.chain().focus().setParagraph().run(), checked: !safeIsActive("heading") },
    { kind: "separator" },
    { kind: "action", label: "Quote", action: () => editor.chain().focus().toggleBlockquote().run(), checked: safeIsActive("blockquote") },
  ];

  const insertSubmenu: MenuItemType[] = [
    { kind: "action", label: "Image", action: () => insertMarkdownImage(editor) },
    { kind: "action", label: "Video", action: () => insertMarkdownVideo(editor) },
    { kind: "separator" },
    { kind: "action", label: "Table", action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { kind: "action", label: "Horizontal rule", action: () => editor.chain().focus().setHorizontalRule().run() },
    { kind: "separator" },
    { kind: "action", label: "Code block", action: () => editor.chain().focus().toggleCodeBlock().run() },
    { kind: "action", label: "Math block", action: () => editor.chain().focus().setMathBlock({ latex: "" }).run() },
    { kind: "action", label: "PlantUML block", action: () => editor.chain().focus().setPlantUMLBlock({ source: "@startuml\n\n@enduml" }).run() },
  ];

  const menuItems: MenuItemType[] = [
    { kind: "action", label: "Add Link", shortcut: "Ctrl+K", action: () => insertMarkdownLink(editor) },
    { kind: "separator" },
    ...(hasSelection ? [
      { kind: "action", label: `Search for "${truncatedText}"`, action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, "_blank") } as MenuItemType,
    ] : []),
    { kind: "submenu", label: "Format", children: formatSubmenu },
    { kind: "submenu", label: "Paragraph", children: paragraphSubmenu },
    { kind: "submenu", label: "Insert", children: insertSubmenu },
    { kind: "separator" },
    { kind: "action", label: "Cut", shortcut: "Ctrl+X", action: cutToClipboard, disabled: !hasSelection },
    { kind: "action", label: "Copy", shortcut: "Ctrl+C", action: copyToClipboard, disabled: !hasSelection },
    { kind: "action", label: "Paste", shortcut: "Ctrl+V", action: pasteFromClipboard },
    { kind: "action", label: "Paste as plain text", shortcut: "Ctrl+Shift+V", action: pasteAsPlainText },
    { kind: "action", label: "Select all", shortcut: "Ctrl+A", action: () => editor.chain().focus().selectAll().run() },
  ];

  return createPortal(
    <div ref={menuRef}>
      <MenuPanel items={menuItems} position={clickPosition} onClose={closeMenu} />
    </div>,
    document.body
  );
}
