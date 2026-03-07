# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server (Vite)
pnpm build        # TypeScript check + Vite production build
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

No test framework is currently configured.

## Architecture

This is a Markdown editor built with TipTap 3.20.1 (ProseMirror wrapper) + React 19 + TypeScript 5.9.

### Core Data Flow

The editor uses **tiptap-markdown** for bidirectional Markdown conversion, operating directly on the ProseMirror document model (no HTML intermediate):

```
Rich Text Mode (TipTap)  <->  Markdown String (tiptap-markdown)  <->  Source Mode (CodeMirror 6)
```

- **Rich -> Source**: `editor.storage.markdown.getMarkdown()`
- **Source -> Rich**: `editor.commands.setContent(markdownString)`

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/use-markdown-editor.ts` | Main hook that configures TipTap with all extensions |
| `src/lib/slash-command-suggestion.tsx` | Slash command Suggestion API config with Tippy.js |
| `src/lib/word-segmentation.ts` | Intl.Segmenter-based word boundary detection for CJK |
| `src/components/Editor/Editor.tsx` | Root component managing dual-view (rich text / source) |
| `src/components/Editor/SourceEditor.tsx` | CodeMirror 6 Markdown editor for source mode |
| `src/components/Editor/ContextMenu/` | Right-click context menu for formatting/insert/clipboard |
| `src/components/Editor/LinkInput/` | Inline popover for adding/editing links |
| `src/extensions/index.ts` | Barrel export for all custom TipTap extensions |

### Extension Pattern

Custom extensions in `src/extensions/` follow this pattern for Markdown round-trip via tiptap-markdown:

```typescript
addStorage() {
  return {
    markdown: {
      serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
        // Output Markdown syntax
        state.write("```plantuml\n");
        state.text(node.attrs.source, false);
        state.ensureNewLine();
        state.write("```");
        state.closeBlock(node);
      },
      parse: {
        setup(markdownit: MarkdownItInstance) {
          // Configure markdown-it rules for parsing
        },
      },
    },
  };
}
```

Extensions without standard Markdown syntax (Image, VideoBlock) serialize as raw HTML with `html: true` enabled in the Markdown extension config.

### Custom Node Types

| Node | Syntax | Description |
|------|--------|-------------|
| MathInline | `$...$` | KaTeX inline math, click to edit |
| MathBlock | `$$...$$` | KaTeX block math with textarea + live preview |
| PlantUMLBlock | ` ```plantuml ` | Encodes to plantuml.com SVG, 500ms debounce |
| Image | raw HTML | Resizable image with custom NodeView (10-100% width) |
| VideoBlock | raw HTML | Resizable video player with custom NodeView |
| SlashCommand | `/` trigger | Command palette with groups (text/list/block/media/advanced) |
| Highlight | `==...==` | Marker pen style highlighting |
| HeadingPlaceholder | - | Shows "Heading N" placeholder in empty headings |
| LiveMarkdown | - | Typora-style live preview (shows syntax when cursor inside) |

### Styling

- CSS variables defined in `src/styles/reset.css`
- Editor content styles in `src/styles/editor.css` (target `.tiptap` class)
- Code highlighting in `src/styles/hljs.css` (GitHub Light theme)
- KaTeX math styles in `src/styles/katex.css`
- Component styles use CSS Modules (`*.module.css`)
- Icons use Phosphor Icons (`@phosphor-icons/react`)

### UI Theme

- Dark toolbar (#1c1c1e) with glass effect (backdrop-filter blur)
- White editor area with accent blue (#2563eb)
- Right-click context menu with glass-morphism styling
- Linear-inspired design with 150ms ease transitions

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Shift+H | Highlight |
| Ctrl+K | Add link |
| Ctrl+M | Toggle source/rich text view |
| Ctrl+Alt+1-6 | Heading 1-6 |
| Ctrl+Alt+0 | Paragraph |
