# Library Utilities

All utility functions are in `src/lib/`.

## Contents

- [useMarkdownEditor](#usemarkdowneditor)
- [slashCommandSuggestion](#slashcommandsuggestion)
- [linkUtils](#linkutils)
- [wordSegmentation](#wordsegmentation)

---

## useMarkdownEditor

**File**: `use-markdown-editor.ts`

**Purpose**: React hook that initializes the TipTap editor

**Signature**:
```ts
function useMarkdownEditor(options?: UseMarkdownEditorOptions): Editor | null
```

**Options**:
```ts
interface UseMarkdownEditorOptions {
  /** Initial content (Markdown string) */
  content?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Content update callback */
  onUpdate?: (markdown: string) => void;
}
```

**Default Content**:
```markdown
## Welcome to the Editor

Start typing, or press `/` for commands…
```

**Default Placeholder**: `Type '/' for commands…`

**Registered Extensions**:

| Extension | Configuration |
|-----------|---------------|
| StarterKit | heading: { levels: [1,2,3,4,5,6] }, codeBlock: false |
| Placeholder | Per-node-type placeholder function |
| Markdown | html: true, transformPastedText: true, transformCopiedText: true |
| CustomKeymap | - |
| Underline | - |
| TaskList, TaskItem | - |
| Link | - |
| Image | - |
| Table, TableRow, TableHeader, TableCell | - |
| CodeBlockLowlight | - |
| MathInline, MathBlock | - |
| PlantUMLBlock | - |
| VideoBlock | - |
| Highlight | - |
| TyporaMode | - |
| SlashCommand | suggestion: slashCommandSuggestion |

**Placeholder Configuration**:
```ts
Placeholder.configure({
  showOnlyWhenEditable: true,
  showOnlyCurrent: true,
  placeholder: ({ node }) => {
    if (node.type.name === "heading") {
      return `Heading ${node.attrs.level}`;
    }
    return placeholder;
  },
})
```

**editorProps**:
```ts
{
  attributes: {
    spellcheck: "false"
  }
}
```

**onUpdate Callback**:
```ts
onUpdate: ({ editor }) => {
  const storage = editor.storage as { markdown: MarkdownStorage };
  onUpdate?.(storage.markdown.getMarkdown());
}
```

**Usage**:
```tsx
import { useMarkdownEditor } from "@/lib/use-markdown-editor";

function MyEditor() {
  const editor = useMarkdownEditor({
    content: "# Hello World",
    onUpdate: (markdown) => console.log(markdown),
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
```

---

## slashCommandSuggestion

**File**: `slash-command-suggestion.tsx`

**Purpose**: Suggestion configuration for slash commands

**Export**:
```ts
const slashCommandSuggestion: Partial<SuggestionOptions<SlashCommandItem>>
```

### items

Filters command list based on query:
```ts
items: ({ query }) => {
  return slashCommandItems.filter((item) =>
    item.title.toLowerCase().startsWith(query.toLowerCase())
  );
}
```

### render

Renders menu using ReactRenderer + Tippy.js:

```ts
render: () => {
  let component: ReactRenderer<SlashMenuRef> | null = null;
  let popup: TippyInstance[] | null = null;

  return {
    onStart: (props) => { ... },
    onUpdate: (props) => { ... },
    onKeyDown: (props) => { ... },
    onExit: () => { ... },
  };
}
```

**Tippy Configuration**:
| Option | Value |
|--------|-------|
| placement | bottom-start |
| trigger | manual |
| interactive | true |
| showOnCreate | true |
| appendTo | document.body |

**Rendering Flow**:
1. User types `/`
2. Suggestion API triggers `onStart`
3. Creates ReactRenderer to render SlashMenu component
4. Creates Tippy instance, uses `clientRect` for positioning
5. `onUpdate` updates filtered results and position on user input
6. Keyboard events passed to SlashMenu via `onKeyDown`
7. `onExit` cleans up when user selects command or presses Escape

**Dependencies**:
- `@tiptap/react` - ReactRenderer
- `tippy.js` - Popup positioning
- `@/components/Editor/SlashMenu` - Menu component
- `@/extensions/slash-command` - Command list

---

## linkUtils

**File**: `link-utils.ts`

**Purpose**: Plain Markdown link and image insertion helpers

### insertMarkdownLink

**Signature**:
```ts
function insertMarkdownLink(editor: Editor): void
```

**Behavior**:
| Selection State | Action |
|-----------------|--------|
| No selection | Insert `[]()`, cursor inside `[]` |
| Has selection | Wrap as `[selectedText]()`, cursor inside `()` |

**Usage**:
```ts
import { insertMarkdownLink } from "@/lib/link-utils";

// Via keyboard shortcut (Mod-k)
insertMarkdownLink(editor);
```

### insertMarkdownImage

**Signature**:
```ts
function insertMarkdownImage(editor: Editor): void
```

**Behavior**:
| Selection State | Action |
|-----------------|--------|
| No selection | Insert `![]()`, cursor inside `[]` for alt text |
| Has selection | Use selection as alt text: `![selectedText]()`, cursor inside `()` |

**Usage**:
```ts
import { insertMarkdownImage } from "@/lib/link-utils";

// Via context menu
insertMarkdownImage(editor);
```

### insertMarkdownVideo

**Signature**:
```ts
function insertMarkdownVideo(editor: Editor): void
```

**Behavior**:
| Selection State | Action |
|-----------------|--------|
| No selection | Insert `@[]()`, cursor inside `[]` for title |
| Has selection | Use selection as title: `@[selectedText]()`, cursor inside `()` |

**Usage**:
```ts
import { insertMarkdownVideo } from "@/lib/link-utils";

// Via context menu or slash command
insertMarkdownVideo(editor);
```

---

## wordSegmentation

**File**: `word-segmentation.ts`

**Purpose**: CJK-aware word boundary detection using `Intl.Segmenter`

### WordBoundary

```ts
interface WordBoundary {
  start: number;
  end: number;
  word: string;
}
```

### findWordAtPosition

**Signature**:
```ts
function findWordAtPosition(text: string, cursorPos: number): WordBoundary | null
```

**Purpose**: Find the word at a given cursor position

**Features**:
- Uses `Intl.Segmenter` for proper CJK word boundary detection
- Falls back to regex matching if Segmenter unavailable
- Returns `null` if cursor is not within a word

**Fallback Regex**: `/[\w\u4e00-\u9fff\u3400-\u4dbf]+/g`
- Matches ASCII word characters
- Matches CJK unified ideographs (U+4E00-U+9FFF)
- Matches CJK extension A (U+3400-U+4DBF)

### getWords

**Signature**:
```ts
function getWords(text: string): WordBoundary[]
```

**Purpose**: Get all words in a text string

**Features**:
- Returns array of all word segments with positions
- Uses same `Intl.Segmenter` / regex fallback strategy
