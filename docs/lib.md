# 工具库 (Lib)

所有工具函数位于 `src/lib/`。

## 目录

- [useMarkdownEditor](#usemarkdowneditor)
- [markdown-converter](#markdown-converter)
- [slash-command-suggestion](#slash-command-suggestion)

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
  content?: string;       // 初始 HTML 内容
  placeholder?: string;   // 占位符文字
  onUpdate?: (html: string) => void;  // 内容变更回调
}
```

**默认内容**:
```html
<h2>Welcome to the Editor</h2>
<p>Start typing, or press <code>/</code> for commands…</p>
```

**注册的扩展**:
| 扩展 | 配置 |
|------|------|
| StarterKit | heading: { levels: [1,2,3] }, codeBlock: false |
| Placeholder | placeholder 文字 |
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
| SlashCommand | suggestion 配置 |

**用法**:
```tsx
const editor = useMarkdownEditor({
  content: '<p>Hello</p>',
  onUpdate: (html) => console.log(html)
});
```

---

## markdown-converter

**文件**: `markdown-converter.ts`

**功能**: HTML 与 Markdown 双向转换

### htmlToMarkdown

**签名**:
```ts
function htmlToMarkdown(html: string): string
```

**依赖**: turndown

**配置**:
| 选项 | 值 |
|------|------|
| headingStyle | atx (`#` 风格) |
| codeBlockStyle | fenced (三个反引号) |
| bulletListMarker | `-` |

**自定义规则**:
| 规则 | 处理 |
|------|------|
| taskListItem | `- [x]` / `- [ ]` 格式 |
| fencedCodeBlock | 保留语言标识 |
| mathBlock | `$$..$$` 格式 |
| mathInline | `$...$` 格式 |

### markdownToHtml

**签名**:
```ts
function markdownToHtml(markdown: string): string
```

**依赖**: markdown-it

**配置**:
| 选项 | 值 |
|------|------|
| html | true |
| linkify | true |
| typographer | false |

---

## slash-command-suggestion

**文件**: `slash-command-suggestion.tsx`

**功能**: 斜杠命令的 Suggestion 配置

**导出**:
```ts
const slashCommandSuggestion: Partial<SuggestionOptions<SlashCommandItem>>
```

**配置项**:

| 属性 | 说明 |
|------|------|
| items | 根据查询过滤命令列表 |
| render | 使用 ReactRenderer + Tippy.js 渲染菜单 |

**Tippy 配置**:
| 选项 | 值 |
|------|------|
| placement | bottom-start |
| trigger | manual |
| interactive | true |
| getReferenceClientRect | 获取光标位置 |

**渲染流程**:
1. 用户输入 `/`
2. Suggestion API 触发 `onStart`
3. 创建 ReactRenderer 渲染 SlashMenu
4. 创建 Tippy 实例定位弹窗
5. 用户选择命令后调用 `onExit` 清理
