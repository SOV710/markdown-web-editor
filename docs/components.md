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

**Purpose**: Right-click context menu with nested submenus for formatting, insertion, and clipboard operations

**Props**:
```ts
interface ContextMenuProps {
  editor: Editor | null;
}
```

**Rendering**: Uses `createPortal` to render to `document.body`, avoiding React/ProseMirror DOM conflicts

**Menu Structure** (nested submenus):

| Item | Type | Description |
|------|------|-------------|
| Add Link | action | Insert `[]()` link syntax (Ctrl+K) |
| Search for "..." | action | Google search for selected text (only with selection) |
| Format ▸ | submenu | Bold, Italic, Strikethrough, Highlight, Code, Math, Clear formatting |
| Paragraph ▸ | submenu | Lists, Heading 1-6, Body, Quote |
| Insert ▸ | submenu | Image, Video, Table, HR, Code block, Math block, PlantUML |
| Cut | action | Cut to clipboard (disabled without selection) |
| Copy | action | Copy to clipboard (disabled without selection) |
| Paste | action | Paste from clipboard |
| Paste as plain text | action | Paste without formatting |
| Select all | action | Select all content |

**Format Submenu**:
- Bold (Ctrl+B), Italic (Ctrl+I), Strikethrough (Ctrl+Shift+S), Highlight (Ctrl+Shift+H)
- Code (Ctrl+E), Math
- Clear formatting
- Shows checkmark (✓) for active formats

**Paragraph Submenu**:
- Bullet list, Numbered list, Task list
- Heading 1-6 (Ctrl+Alt+1-6), Body (Ctrl+Alt+0)
- Quote
- Mutually exclusive checkmarks for heading/body

**Insert Submenu**:
- Image, Video
- Table, Horizontal rule
- Code block, Math block, PlantUML block

**Features**:
- Submenus open on hover with 150ms delay
- Auto-flip positioning when near viewport edges (horizontal and vertical)
- Uses DOM traversal in `useLayoutEffect` for submenu positioning
- Keyboard navigation: Arrow keys, Enter, Escape

**State**:
| State | Type | Description |
|-------|------|-------------|
| isOpen | boolean | Menu visibility |
| clickPosition | {x, y} | Original click position |
| hasSelection | boolean | Whether text is selected |
| selectedText | string | Selected text content |

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

**Features**:
- Auto-scroll: selected item scrolls into view on keyboard navigation
- Custom scrollbar: thin dark scrollbar matching glass theme (Firefox + WebKit)

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
