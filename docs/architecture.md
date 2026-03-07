# Architecture

## Layer Structure

```
┌─────────────────────────────────────────┐
│              App.tsx                    │  Entry point
├─────────────────────────────────────────┤
│           Components Layer              │  UI components
│  (Editor, ContextMenu, TableMenu, ...)  │
├─────────────────────────────────────────┤
│             Library Layer               │  Utilities
│  (useMarkdownEditor, linkUtils, ...)    │
├─────────────────────────────────────────┤
│           Extensions Layer              │  TipTap extensions
│  (Image, Table, MathBlock, ...)         │
├─────────────────────────────────────────┤
│         TipTap / ProseMirror            │  Editor core
└─────────────────────────────────────────┘
```

## Data Flow

```
User Input
    │
    ▼
TipTap Editor (ProseMirror)
    │
    ▼
Extensions process nodes/marks
    │
    ▼
tiptap-markdown serialization
    │
    ▼
onUpdate callback → returns Markdown string
```

## View Mode Toggle

Bidirectional conversion using tiptap-markdown directly on ProseMirror document model:

```
Rich Text Mode                    Source Mode (CodeMirror 6)
     │                                 │
     │  Ctrl+M or click toggle         │
     ▼                                 ▼
editor.storage.markdown ────→   Markdown string
    .getMarkdown()                     │
                                       │
editor.commands ←──────────────  User edits
    .setContent(markdown)
```

## Directory Responsibilities

| Directory | Purpose |
|-----------|---------|
| `src/extensions/` | TipTap Node and Extension definitions |
| `src/components/Editor/` | React UI components |
| `src/lib/` | Editor initialization hook, utilities |
| `src/styles/` | CSS variables, editor content styles |
| `src/types/` | TypeScript type definitions |

## Extension Types

TipTap extensions fall into three categories:

| Type | Description | Examples |
|------|-------------|----------|
| Node | Block or inline content | Image, Table, MathBlock, VideoBlock |
| Mark | Text decoration | Underline, Link, Highlight |
| Extension | Feature enhancement | SlashCommand, CustomKeymap, LiveMarkdown |

## Key Design Decisions

### 1. Markdown Bidirectional Conversion

Using tiptap-markdown extension:
- `html: true` allows raw HTML (for Image/VideoBlock width preservation)
- `transformPastedText: true` converts pasted text
- `transformCopiedText: true` converts copied text
- Custom extensions define serialization/parsing via `addStorage().markdown`

### 2. Resizable Media

Image and VideoBlock use custom NodeView:
- Container div with left/right resize-handle elements
- mousedown/mousemove/mouseup events calculate width percentage
- `tr.setNodeMarkup()` updates node attributes
- Width range: 10% - 100%
- Serializes as `<img width="50%">` / `<video width="50%">`

### 3. Slash Commands

Based on TipTap Suggestion API:
- Listens for `/` character trigger
- Tippy.js positions popup menu (placement: bottom-start)
- Keyboard navigation (ArrowUp/Down, Enter, Escape)
- Command groups: text, list, block, media, advanced
- Fuzzy search filtering

### 4. Dual View Synchronization

- Rich Text → Source: `editor.storage.markdown.getMarkdown()`
- Source → Rich Text: `editor.commands.setContent(markdownString)`
- Shortcut: `Ctrl+M` toggles view
- Source editor uses CodeMirror 6 with Markdown language support

### 5. Portal Rendering

ContextMenu renders via `createPortal(element, document.body)`:
- Avoids React/ProseMirror DOM conflicts
- ProseMirror mutates DOM directly outside React's knowledge
- Rendering inside ProseMirror-managed DOM causes `insertBefore` errors
- Portal ensures menu DOM is managed separately

### 6. Live Markdown Preview

LiveMarkdown extension uses ProseMirror decorations:
- Adds widget decorations for Markdown syntax markers
- Shows `**` around bold text, `#` before headings when cursor is inside
- Hides markers when cursor moves elsewhere (Typora-style)
- Wrapped in try-catch returning `DecorationSet.empty` on error

### 7. Placeholder System

Uses TipTap Placeholder extension with per-node-type function:
```typescript
Placeholder.configure({
  placeholder: ({ node }) => {
    if (node.type.name === "heading") {
      return `Heading ${node.attrs.level}`;
    }
    return "Type '/' for commands…";
  },
})
```
