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

---

## Editor

**文件**: `Editor.tsx`

**功能**: 主编辑器容器，管理视图模式切换

**Props**:
```ts
interface EditorProps {
  content?: string;       // 初始 HTML 内容
  placeholder?: string;   // 占位文字
  onUpdate?: (html: string) => void;  // 内容更新回调
  className?: string;
}
```

**状态**:
| 状态 | 类型 | 说明 |
|------|------|------|
| viewMode | "richtext" \| "source" | 当前视图模式 |
| markdownSource | string | Markdown 源码 |

**快捷键**: `Ctrl+M` 切换视图

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
    │   └── DragHandle
    └── SourceEditor (source 模式)
```

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

| 组 | 按钮 |
|------|------|
| 标题 | H1, H2, H3 |
| 文本样式 | B (粗体), I (斜体), U (下划线), S (删除线), <> (行内代码), 链接 |
| 块元素 | 无序列表, 有序列表, 任务列表, 引用, 代码块, 分隔线, 图片, 表格, 视频 |

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
- 有文本选中
- 非代码块、图片、数学公式、PlantUML、视频块

**按钮**: B, I, U, S, Code, Link

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

**显示条件**: 光标在表格内

**操作**:
| 按钮 | 功能 |
|------|------|
| + Col | 右侧添加列 |
| - Col | 删除当前列 |
| + Row | 下方添加行 |
| - Row | 删除当前行 |
| Delete | 删除整个表格 |

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

**键盘导航**:
| 按键 | 动作 |
|------|------|
| ↑ | 上一项 |
| ↓ | 下一项 |
| Enter | 执行命令 |
| Escape | 关闭菜单 |

---

## SourceEditor

**文件**: `SourceEditor.tsx`

**功能**: Markdown 源码编辑器

**Props**:
```ts
interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

**特性**:
- 自动调整高度
- 等宽字体
- 禁用拼写检查

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

**按钮**:
| 图标 | 模式 |
|------|------|
| 横线图标 | Rich Text |
| 尖括号图标 | Source |

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

**样式**:
- 默认隐藏
- 鼠标悬停显示左右把手
- 拖动时显示蓝色指示条
