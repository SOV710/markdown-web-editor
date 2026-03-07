# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server (Vite)
pnpm build        # TypeScript check + Vite production build
pnpm preview      # Preview production build
```

No test framework is currently configured.

## Architecture

This is a Markdown editor built with TipTap v3 (ProseMirror wrapper) + React 19 + TypeScript.

### Core Data Flow

The editor uses **tiptap-markdown** for bidirectional Markdown conversion, operating directly on the ProseMirror document model (no HTML intermediate):

```
Rich Text Mode (TipTap)  ←→  Markdown String (tiptap-markdown)  ←→  Source Mode (CodeMirror 6)
```

- **Rich → Source**: `editor.storage.markdown.getMarkdown()`
- **Source → Rich**: `editor.commands.setContent(markdownString)`

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/use-markdown-editor.ts` | Main hook that configures TipTap with all extensions |
| `src/components/Editor/Editor.tsx` | Root component managing dual-view (rich text / source) |
| `src/components/Editor/SourceEditor.tsx` | CodeMirror 6 Markdown editor for source mode |
| `src/extensions/index.ts` | Barrel export for all custom TipTap extensions |

### Extension Pattern

Custom extensions in `src/extensions/` follow this pattern for Markdown round-trip:

```typescript
addStorage() {
  return {
    markdown: {
      serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
        // Output Markdown syntax
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

- **MathInline/MathBlock**: KaTeX rendering, serializes as `$...$` / `$$...$$`
- **PlantUMLBlock**: Encodes to plantuml.com SVG, serializes as ` ```plantuml ` fence
- **Image/VideoBlock**: Resizable media with custom NodeView, serializes as raw HTML to preserve width
- **SlashCommand**: `/` triggered command palette using TipTap Suggestion API

### Styling

- CSS variables defined in `src/styles/editor.css`
- Component styles use CSS Modules (`*.module.css`)
- Editor content styles target `.ProseMirror` class
