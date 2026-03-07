# 工具库 (Lib)

所有工具函数位于 `src/lib/`。

## 目录

- [useMarkdownEditor](#usemarkdowneditor)
- [slashCommandSuggestion](#slashcommandsuggestion)

---

## useMarkdownEditor

**文件**: `use-markdown-editor.ts`

**功能**: 初始化 TipTap 编辑器的 React Hook

**签名**:
```ts
function useMarkdownEditor(options?: UseMarkdownEditorOptions): Editor | null
```

**Options**:
```ts
interface UseMarkdownEditorOptions {
  /** 初始内容 (Markdown string) */
  content?: string;
  /** placeholder 提示文字 */
  placeholder?: string;
  /** 内容变更回调 */
  onUpdate?: (markdown: string) => void;
}
```

**默认内容**:
```markdown
## Welcome to the Editor

Start typing, or press `/` for commands…
```

**默认 placeholder**: `Type '/' for commands…`

**注册的扩展**:

| 扩展 | 配置 |
|------|------|
| StarterKit | heading: { levels: [1,2,3] }, codeBlock: false |
| Placeholder | placeholder 文字 |
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
| SlashCommand | suggestion: slashCommandSuggestion |

**editorProps**:
```ts
{
  attributes: {
    spellcheck: "false"
  }
}
```

**onUpdate 回调**:
```ts
onUpdate: ({ editor }) => {
  const storage = editor.storage as { markdown: MarkdownStorage };
  onUpdate?.(storage.markdown.getMarkdown());
}
```

**用法**:
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

**文件**: `slash-command-suggestion.tsx`

**功能**: 斜杠命令的 Suggestion 配置

**导出**:
```ts
const slashCommandSuggestion: Partial<SuggestionOptions<SlashCommandItem>>
```

### items

根据查询过滤命令列表:
```ts
items: ({ query }) => {
  return slashCommandItems.filter((item) =>
    item.title.toLowerCase().startsWith(query.toLowerCase())
  );
}
```

### render

使用 ReactRenderer + Tippy.js 渲染菜单:

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

**Tippy 配置**:
| 选项 | 值 |
|------|------|
| placement | bottom-start |
| trigger | manual |
| interactive | true |
| showOnCreate | true |
| appendTo | document.body |

**渲染流程**:
1. 用户输入 `/`
2. Suggestion API 触发 `onStart`
3. 创建 ReactRenderer 渲染 SlashMenu 组件
4. 创建 Tippy 实例，使用 `clientRect` 定位弹窗
5. 用户输入时 `onUpdate` 更新过滤结果和位置
6. 键盘事件通过 `onKeyDown` 传递给 SlashMenu
7. 用户选择命令或按 Escape 后 `onExit` 清理

**依赖**:
- `@tiptap/react` - ReactRenderer
- `tippy.js` - 弹出定位
- `@/components/Editor/SlashMenu` - 菜单组件
- `@/extensions/slash-command` - 命令列表
