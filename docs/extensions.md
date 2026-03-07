# 扩展 (Extensions)

所有扩展位于 `src/extensions/`，通过 `index.ts` 统一导出。

## 目录

- [Underline](#underline)
- [Link](#link)
- [Image](#image)
- [VideoBlock](#videoblock)
- [Table](#table)
- [TaskList / TaskItem](#tasklist--taskitem)
- [CodeBlockLowlight](#codeblocklowlight)
- [MathInline](#mathinline)
- [MathBlock](#mathblock)
- [PlantUMLBlock](#plantumlblock)
- [SlashCommand](#slashcommand)
- [CustomKeymap](#customkeymap)

---

## Underline

**文件**: `underline.ts`

**类型**: Mark

**功能**: 下划线文本修饰

**快捷键**: `Ctrl+U`

**用法**:
```ts
editor.chain().focus().toggleUnderline().run()
```

---

## Link

**文件**: `link.ts`

**类型**: Mark

**功能**: 超链接

**配置**:
| 选项 | 值 | 说明 |
|------|------|------|
| openOnClick | false | 编辑模式下点击不跳转 |
| autolink | true | 自动识别 URL |
| linkOnPaste | true | 粘贴 URL 自动转为链接 |

**用法**:
```ts
editor.chain().focus().setLink({ href: 'https://...' }).run()
editor.chain().focus().unsetLink().run()
```

---

## Image

**文件**: `image.ts`

**类型**: Node

**功能**: 可调整大小的图片

**属性**:
| 属性 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| src | string | null | 图片 URL |
| alt | string | null | 替代文本 |
| title | string | null | 标题 |
| width | number | 100 | 宽度百分比 (10-100) |

**NodeView**: 自定义 DOM 结构
```html
<div class="resizable-image" style="width: {width}%">
  <div class="resize-handle resize-handle-left"></div>
  <img src="..." />
  <div class="resize-handle resize-handle-right"></div>
</div>
```

**用法**:
```ts
editor.chain().focus().setImage({ src: '...' }).run()
```

---

## VideoBlock

**文件**: `video-block.ts`

**类型**: Node

**功能**: 可调整大小的视频播放器

**属性**:
| 属性 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| src | string | "" | 视频 URL |
| width | number | 100 | 宽度百分比 |
| title | string | "" | 标题 |

**用法**:
```ts
editor.commands.insertContent({
  type: 'videoBlock',
  attrs: { src: '...' }
})
```

---

## Table

**文件**: `table.ts`

**类型**: Node (Table, TableRow, TableHeader, TableCell)

**功能**: 表格编辑

**导出**:
- `Table` - 表格容器
- `TableRow` - 行
- `TableHeader` - 表头单元格
- `TableCell` - 普通单元格

**用法**:
```ts
editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
editor.chain().focus().addColumnAfter().run()
editor.chain().focus().deleteRow().run()
```

---

## TaskList / TaskItem

**文件**: `task-list.ts`

**类型**: Node

**功能**: 带复选框的任务列表

**配置**:
- `nested: true` - 支持嵌套

**用法**:
```ts
editor.chain().focus().toggleTaskList().run()
```

---

## CodeBlockLowlight

**文件**: `code-block.ts`

**类型**: Node

**功能**: 语法高亮代码块

**依赖**: lowlight

**预注册语言**:
- javascript, typescript
- python, go, rust
- html, css
- json, yaml, markdown
- bash, sql

**用法**:
```ts
editor.chain().focus().toggleCodeBlock().run()
```

---

## MathInline

**文件**: `math-inline.ts`

**类型**: Node (inline)

**功能**: 行内数学公式

**语法**: `$LaTeX$`

**属性**:
| 属性 | 类型 | 说明 |
|------|------|------|
| latex | string | LaTeX 源码 |

**NodeView**: 点击显示编辑弹窗，使用 KaTeX 渲染

---

## MathBlock

**文件**: `math-block.ts`

**类型**: Node (block)

**功能**: 块级数学公式

**语法**:
```
$$
LaTeX
$$
```

**NodeView**: 上方 textarea 输入，下方实时 KaTeX 预览

---

## PlantUMLBlock

**文件**: `plantuml-block.ts`

**类型**: Node

**功能**: PlantUML 图表

**属性**:
| 属性 | 类型 | 说明 |
|------|------|------|
| source | string | PlantUML 源码 |

**渲染**: 编码后请求 `https://www.plantuml.com/plantuml/svg/{encoded}`

**防抖**: 500ms

---

## SlashCommand

**文件**: `slash-command.ts`

**类型**: Extension

**功能**: 斜杠命令菜单

**触发**: 输入 `/`

**命令列表**:
| 命令 | 说明 |
|------|------|
| Heading 1/2/3 | 插入标题 |
| Bullet List | 无序列表 |
| Numbered List | 有序列表 |
| Task List | 任务列表 |
| Blockquote | 引用块 |
| Code Block | 代码块 |
| Horizontal Rule | 分隔线 |
| Table | 3x3 表格 |
| Image | 图片 |
| Video | 视频 |
| Math Block | 数学公式块 |
| PlantUML | UML 图表 |

---

## CustomKeymap

**文件**: `custom-keymap.ts`

**类型**: Extension

**功能**: 自定义快捷键

**快捷键**:
| 快捷键 | 动作 |
|------|------|
| Ctrl+Alt+1 | Heading 1 |
| Ctrl+Alt+2 | Heading 2 |
| Ctrl+Alt+3 | Heading 3 |
| Ctrl+Alt+0 | 普通段落 |
| Ctrl+U | 下划线 |
