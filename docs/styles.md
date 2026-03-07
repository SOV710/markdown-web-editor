# 样式系统 (Styles)

全局样式位于 `src/styles/`，组件样式使用 CSS Modules。

## 目录

- [reset.css](#resetcss)
- [editor.css](#editorcss)
- [hljs.css](#hljscss)
- [katex.css](#katexcss)
- [CSS Modules](#css-modules)

---

## reset.css

**文件**: `src/styles/reset.css`

**功能**: CSS 变量定义和全局重置

### 设计令牌

**间距**:
| 变量 | 值 |
|------|------|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-6 | 24px |
| --space-8 | 32px |

**颜色**:
| 变量 | 值 | 说明 |
|------|------|------|
| --color-bg | #ffffff | 背景色 |
| --color-bg-subtle | #f6f8fa | 次级背景 |
| --color-text | #24292f | 主文本 |
| --color-text-secondary | #57606a | 次级文本 |
| --color-text-placeholder | #8b949e | 占位符 |
| --color-border | #d0d7de | 边框 |
| --color-accent | #0969da | 强调色 |

**字体**:
| 变量 | 值 |
|------|------|
| --font-sans | system-ui, -apple-system, sans-serif |
| --font-mono | ui-monospace, SFMono-Regular, monospace |

**圆角**:
| 变量 | 值 |
|------|------|
| --radius-sm | 4px |
| --radius-md | 6px |
| --radius-lg | 8px |

---

## editor.css

**文件**: `src/styles/editor.css`

**功能**: TipTap 编辑器内容区域样式

**选择器前缀**: `.tiptap`

### 元素样式

| 选择器 | 说明 |
|------|------|
| `.tiptap h1/h2/h3` | 标题样式 |
| `.tiptap p` | 段落 |
| `.tiptap strong/em/u/s` | 文本修饰 |
| `.tiptap code` | 行内代码 |
| `.tiptap pre` | 代码块 |
| `.tiptap blockquote` | 引用块 |
| `.tiptap ul/ol` | 列表 |
| `.tiptap ul[data-type="taskList"]` | 任务列表 |
| `.tiptap hr` | 分隔线 |
| `.tiptap a` | 链接 |
| `.tiptap img` | 图片 |
| `.tiptap table/th/td` | 表格 |

### 特殊块

| 类名 | 说明 |
|------|------|
| `.plantuml-block` | PlantUML 容器 |
| `.plantuml-block-input` | PlantUML 输入框 |
| `.plantuml-block-preview` | PlantUML 预览区 |
| `.video-block` | 视频容器 |
| `.video-block-player` | 视频播放器 |

### 可调整大小的媒体

| 类名 | 说明 |
|------|------|
| `.resizable-image` | 图片容器 |
| `.resizable-video` | 视频容器 |
| `.resize-handle` | 调整把手 |
| `.resize-handle-left` | 左侧把手 |
| `.resize-handle-right` | 右侧把手 |

---

## hljs.css

**文件**: `src/styles/hljs.css`

**功能**: 代码语法高亮 (GitHub Light 主题)

**类名前缀**: `.hljs-`

**主要语法类**:
| 类名 | 颜色 | 用途 |
|------|------|------|
| `.hljs-keyword` | #cf222e | 关键字 |
| `.hljs-string` | #0a3069 | 字符串 |
| `.hljs-number` | #0550ae | 数字 |
| `.hljs-comment` | #6e7781 | 注释 |
| `.hljs-function` | #8250df | 函数名 |
| `.hljs-variable` | #953800 | 变量 |
| `.hljs-title` | #8250df | 标题/函数定义 |

---

## katex.css

**文件**: `src/styles/katex.css`

**功能**: KaTeX 数学公式样式

**导入**: `katex/dist/katex.min.css`

**自定义样式**:
| 类名 | 说明 |
|------|------|
| `.math-inline` | 行内公式容器 |
| `.math-block` | 块级公式容器 |
| `.math-block-input` | 公式输入框 |
| `.math-block-preview` | 公式预览区 |
| `.math-inline-editor` | 行内公式编辑弹窗 |

---

## CSS Modules

组件级样式使用 CSS Modules，文件名 `*.module.css`。

| 文件 | 组件 |
|------|------|
| `Editor.module.css` | Editor, Toolbar |
| `BubbleToolbar.module.css` | BubbleToolbar |
| `SlashMenu.module.css` | SlashMenu |
| `SourceEditor.module.css` | SourceEditor |
| `ViewToggle.module.css` | ViewToggle |
| `ResizeHandle.module.css` | ResizeHandle |

### Editor.module.css 主要类

| 类名 | 说明 |
|------|------|
| `.wrapper` | 编辑器外层容器 |
| `.toolbarRow` | 工具栏行 |
| `.toolbar` | 工具栏 |
| `.toolbarBtn` | 工具栏按钮 |
| `.editorArea` | 编辑区域 |
| `.tableMenu` | 表格菜单 |
| `.dragHandle` | 拖动把手 |
