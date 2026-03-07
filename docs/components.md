# Components

All components are in `src/components/Editor/`.

## Contents

- [Editor](#editor)
- [ContextMenu](#contextmenu)
- [TableMenu](#tablemenu)
- [SlashMenu](#slashmenu)
- [SourceEditor](#sourceeditor)
- [ViewToggle](#viewtoggle)
- [ResizeHandle](#resizehandle)

---

## Editor

**File**: `Editor.tsx`

**Purpose**: Main editor container, manages view mode toggle

**Props**:
```ts
interface EditorProps extends UseMarkdownEditorOptions {
  className?: string;
}

// UseMarkdownEditorOptions:
interface UseMarkdownEditorOptions {
  content?: string;       // Initial Markdown content
  placeholder?: string;   // Placeholder text
  onUpdate?: (markdown: string) => void;  // Content update callback
}
```

**State**:
| State | Type | Description |
|-------|------|-------------|
| viewMode | "richtext" \| "source" | Current view mode |
| markdownSource | string | Markdown source |

**Shortcut**: `Ctrl+M` / `Cmd+M` toggles view

**Structure**:
```
Editor
├── toolbarRow
│   └── ViewToggle
└── editorArea
    ├── EditorContent (richtext mode)
    │   ├── TableMenu
    │   └── DragHandle
    └── SourceEditor (source mode)
└── ContextMenu (rendered via portal)
```

**Dependencies**:
- `@tiptap/react` - EditorContent
- `@tiptap/extension-drag-handle-react` - DragHandle
- `@phosphor-icons/react` - DotsSixVertical icon

---

## ContextMenu

**File**: `ContextMenu/ContextMenu.tsx`

**Purpose**: Right-click context menu for formatting, insertion, and clipboard operations

**Props**:
```ts
interface ContextMenuProps {
  editor: Editor | null;
}
```

**Rendering**: Uses `createPortal` to render to `document.body`, avoiding React/ProseMirror DOM conflicts

**Sections**:

| Section | Items |
|---------|-------|
| Format | Bold, Italic, Underline, Strikethrough, Highlight, Inline Code |
| Insert | Link, Image, Table, Code Block, Math Block, Divider |
| Clipboard | Cut, Copy, Paste |

**Features**:
- Auto-flip positioning when near viewport edges
- Measures actual rendered size via `useLayoutEffect`
- Hidden until measured to prevent position flash
- Shows keyboard shortcuts for items
- Highlights active formatting states

**State**:
| State | Type | Description |
|-------|------|-------------|
| isOpen | boolean | Menu visibility |
| clickPosition | {x, y} | Original click position |
| adjustedPosition | {x, y} | Position after flip adjustment |
| measured | boolean | Whether menu has been measured |

**Event Handling**:
- Right-click inside editor opens menu
- Click outside or Escape closes menu
- Clicking menu items executes action and closes

---

## TableMenu

**File**: `TableMenu.tsx`

**Purpose**: Table operations context menu

**Props**:
```ts
interface TableMenuProps {
  editor: Editor;
}
```

**Visibility**: Shows when cursor is in table (`editor.isActive("table")`)

**Operations**:
| Button | Icon | Action |
|--------|------|--------|
| Row | RowsPlusTop | Add row above |
| Row | RowsPlusBottom | Add row below |
| Row | Trash | Delete current row |
| Col | ColumnsPlusLeft | Add column left |
| Col | ColumnsPlusRight | Add column right |
| Col | Trash | Delete current column |
| Table | Trash | Delete entire table |

**Icon Size**: 14px

**Style**: Dark glass effect

---

## SlashMenu

**File**: `SlashMenu.tsx`

**Purpose**: Slash command dropdown menu

**Props**:
```ts
interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}
```

**Ref Methods** (for Suggestion API):
```ts
interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}
```

**Group Display**:
| Group | Label |
|-------|-------|
| text | Text |
| list | Lists |
| block | Blocks |
| media | Media |
| advanced | Advanced |

**Keyboard Navigation**:
| Key | Action |
|-----|--------|
| ArrowUp | Previous item |
| ArrowDown | Next item |
| Enter | Execute command |
| Escape | Close menu |

**Style**: Dark glass effect with group headers and dividers

---

## SourceEditor

**File**: `SourceEditor.tsx`

**Purpose**: CodeMirror 6 Markdown source editor

**Props**:
```ts
interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

**CodeMirror Configuration**:
- `lineNumbers()` - Line numbers
- `highlightActiveLine()` - Highlight current line
- `history()` - Undo/redo
- `markdown()` - Markdown language support
- `syntaxHighlighting()` - Syntax highlighting

**Style**:
- Font: `var(--font-mono)`
- Font size: 14px
- Line height: 1.6
- Background: `var(--color-bg-subtle)`

---

## ViewToggle

**File**: `ViewToggle.tsx`

**Purpose**: View mode toggle buttons

**Props**:
```ts
interface ViewToggleProps {
  mode: "richtext" | "source";
  onModeChange: (mode: ViewMode) => void;
}
```

**Exported Type**:
```ts
export type ViewMode = "richtext" | "source";
```

**Buttons**:
| Icon | Mode | Title |
|------|------|-------|
| TextAlignLeft | richtext | Rich Text View |
| BracketsAngle | source | Markdown Source |

**Icon Size**: 16px

---

## ResizeHandle

**File**: `ResizeHandle.tsx`

**Purpose**: Reusable resize wrapper component

**Props**:
```ts
interface ResizeHandleProps {
  onResize: (widthPercent: number) => void;
  children: React.ReactNode;
  initialWidth?: number;  // Default: 100
}
```

**Range**: 10% - 100%

**Interaction**:
- Left and right drag handles
- Changes body cursor to `ew-resize` during drag
- Multiplier factor 2 (bidirectional adjustment)
