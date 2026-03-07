# 组件 (Components)

所有组件位于 `src/components/Editor/`。

## 目录

- [Editor](#editor)
- [Toolbar](#toolbar)
- [BubbleToolbar](#bubbletoolbar)
- [TableMenu](#tablemenu)
- [SlashMenu](#slashmenu)
- [SourceEditor](#sourceeditor)
- [ViewToggle](#viewtoggle)
- [ResizeHandle](#resizehandle)
- [icons.ts](#iconsts)

---

## Editor

**文件**: `Editor.tsx`

**功能**: 主编辑器容器，管理视图模式切换

**Props**:
```ts
interface EditorProps extends UseMarkdownEditorOptions {
  className?: string;
}

// UseMarkdownEditorOptions:
interface UseMarkdownEditorOptions {
  content?: string;       // 初始 Markdown 内容
  placeholder?: string;   // 占位文字
  onUpdate?: (markdown: string) => void;  // 内容更新回调
}
```

**状态**:
| 状态 | 类型 | 说明 |
|------|------|------|
| viewMode | "richtext" \| "source" | 当前视图模式 |
| markdownSource | string | Markdown 源码 |

**快捷键**: `Ctrl+M` / `Cmd+M` 切换视图

**结构**:
```
Editor
├── toolbarRow
│   ├── Toolbar
│   └── ViewToggle
└── editorArea
    ├── EditorContent (richtext 模式)
    │   ├── TableMenu
    │   ├── BubbleToolbar
    │   └── DragHandle (DotsSixVertical 图标)
    └── SourceEditor (source 模式)
```

**依赖**:
- `@tiptap/react` - EditorContent
- `@tiptap/extension-drag-handle-react` - DragHandle
- `@phosphor-icons/react` - DotsSixVertical

---

## Toolbar

**文件**: `Toolbar.tsx`

**功能**: 顶部格式化工具栏

**Props**:
```ts
interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;     // source 模式时禁用
}
```

**按钮分组**:

| 组 | 按钮 | 图标 |
|------|------|------|
| 标题 | H1, H2, H3 | TextHOne, TextHTwo, TextHThree |
| 文本样式 | 粗体, 斜体, 下划线, 删除线, 行内代码, 链接 | TextB, TextItalic, TextUnderline, TextStrikethrough, Code, Link |
| 块元素 | 无序列表, 有序列表, 任务列表, 引用, 代码块, 分隔线, 图片, 表格, 视频 | ListBullets, ListNumbers, CheckSquare, Quotes, CodeBlock, Minus, Image, Table, VideoCamera |

**图标尺寸**: 18px (`ICON_SIZE`)

---

## BubbleToolbar

**文件**: `BubbleToolbar.tsx`

**功能**: 选中文本时显示的浮动工具栏

**Props**:
```ts
interface BubbleToolbarProps {
  editor: Editor;
}
```

**显示条件**:
- 有文本选中 (`from !== to`)
- 非以下块类型:
  - codeBlock
  - image
  - mathBlock
  - plantumlBlock
  - videoBlock

**按钮**: Bold, Italic, Underline, Strikethrough, Code, Link

**图标尺寸**: 16px (`ICON_SIZE_SM`)

**样式**: 深色玻璃效果 (backdrop-filter blur)

---

## TableMenu

**文件**: `TableMenu.tsx`

**功能**: 表格操作上下文菜单

**Props**:
```ts
interface TableMenuProps {
  editor: Editor;
}
```

**显示条件**: 光标在表格内 (`editor.isActive("table")`)

**操作**:
| 按钮 | 图标 | 功能 |
|------|------|------|
| Row | RowsPlusTop | 上方添加行 |
| Row | RowsPlusBottom | 下方添加行 |
| Row | Trash | 删除当前行 |
| Col | ColumnsPlusLeft | 左侧添加列 |
| Col | ColumnsPlusRight | 右侧添加列 |
| Col | Trash | 删除当前列 |
| Table | Trash | 删除整个表格 |

**图标尺寸**: 14px (`TABLE_ICON_SIZE`)

**样式**: 深色玻璃效果

---

## SlashMenu

**文件**: `SlashMenu.tsx`

**功能**: 斜杠命令下拉菜单

**Props**:
```ts
interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}
```

**Ref 方法** (供 Suggestion API 调用):
```ts
interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}
```

**分组显示**:
| 组 | 标签 |
|------|------|
| text | Text |
| list | Lists |
| block | Blocks |
| media | Media |
| advanced | Advanced |

**键盘导航**:
| 按键 | 动作 |
|------|------|
| ArrowUp | 上一项 |
| ArrowDown | 下一项 |
| Enter | 执行命令 |
| Escape | 关闭菜单 |

**样式**: 深色玻璃效果，带分组标题和分隔线

---

## SourceEditor

**文件**: `SourceEditor.tsx`

**功能**: CodeMirror 6 Markdown 源码编辑器

**Props**:
```ts
interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

**CodeMirror 配置**:
- `lineNumbers()` - 行号
- `highlightActiveLine()` - 高亮当前行
- `history()` - 撤销/重做
- `markdown()` - Markdown 语言支持
- `syntaxHighlighting()` - 语法高亮

**样式**:
- 字体: `var(--font-mono)`
- 字号: 14px
- 行高: 1.6
- 背景: `var(--color-bg-subtle)`

---

## ViewToggle

**文件**: `ViewToggle.tsx`

**功能**: 视图模式切换按钮

**Props**:
```ts
interface ViewToggleProps {
  mode: "richtext" | "source";
  onModeChange: (mode: ViewMode) => void;
}
```

**导出类型**:
```ts
export type ViewMode = "richtext" | "source";
```

**按钮**:
| 图标 | 模式 | 标题 |
|------|------|------|
| TextAlignLeft | richtext | Rich Text View |
| BracketsAngle | source | Markdown Source |

**图标尺寸**: 16px

---

## ResizeHandle

**文件**: `ResizeHandle.tsx`

**功能**: 可复用的调整大小包装器

**Props**:
```ts
interface ResizeHandleProps {
  onResize: (widthPercent: number) => void;
  children: React.ReactNode;
  initialWidth?: number;  // 默认 100
}
```

**范围**: 10% - 100%

**交互**:
- 左右两侧拖动手柄
- 拖动时改变 body cursor 为 `ew-resize`
- 乘数因子 2 (双向调整)

---

## icons.ts

**文件**: `icons.ts`

**功能**: 图标尺寸配置

**导出常量**:
```ts
/** 工具栏按钮默认尺寸 */
export const ICON_SIZE = 18;

/** 浮动菜单较小尺寸 */
export const ICON_SIZE_SM = 16;

/** 默认图标粗细 */
export const ICON_WEIGHT = "regular" as const;
```
