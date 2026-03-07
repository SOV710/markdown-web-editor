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

**颜色 (编辑区)**:
| 变量 | 值 | 说明 |
|------|------|------|
| --color-bg | #ffffff | 背景色 |
| --color-bg-subtle | #f8f9fa | 次级背景 |
| --color-border | #e2e4e8 | 边框 |
| --color-border-strong | #cfd1d6 | 强调边框 |
| --color-text | #1c1e21 | 主文本 |
| --color-text-secondary | #656d76 | 次级文本 |
| --color-text-placeholder | #a0a5ad | 占位符 |
| --color-accent | #2563eb | 强调色 |
| --color-accent-hover | #1d4ed8 | 强调色悬停 |

**工具栏颜色 (深色主题)**:
| 变量 | 值 | 说明 |
|------|------|------|
| --color-toolbar-bg | #1c1c1e | 工具栏背景 |
| --color-toolbar-border | rgba(255, 255, 255, 0.08) | 工具栏边框 |
| --color-toolbar-text | rgba(255, 255, 255, 0.65) | 工具栏文本 |
| --color-toolbar-text-hover | rgba(255, 255, 255, 0.95) | 悬停文本 |
| --color-toolbar-text-active | #ffffff | 激活文本 |
| --color-toolbar-btn-hover-bg | rgba(255, 255, 255, 0.1) | 按钮悬停背景 |
| --color-toolbar-btn-active-bg | var(--color-accent) | 按钮激活背景 |

**字体**:
| 变量 | 值 |
|------|------|
| --font-sans | -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ... |
| --font-mono | "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace |
| --font-size-base | 16px |
| --line-height-base | 1.625 |

**圆角**:
| 变量 | 值 |
|------|------|
| --radius-sm | 6px |
| --radius-md | 8px |
| --radius-lg | 10px |

**阴影**:
| 变量 | 值 |
|------|------|
| --shadow-sm | 0 1px 2px rgba(0, 0, 0, 0.05) |
| --shadow-md | 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05) |
| --shadow-lg | 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06) |

---

## editor.css

**文件**: `src/styles/editor.css`

**功能**: TipTap 编辑器内容区域样式

**选择器前缀**: `.tiptap`

### 基础元素

| 选择器 | 说明 |
|------|------|
| `.tiptap` | 编辑器根容器，padding: var(--space-6), min-height: 300px |
| `.tiptap h1/h2/h3` | 标题样式 |
| `.tiptap p` | 段落，margin-bottom: 0.75em |
| `.tiptap strong/em/u/s` | 文本修饰 |
| `.tiptap code` | 行内代码，灰色背景 + 圆角 |
| `.tiptap pre` | 代码块，左侧 3px 强调边框 |
| `.tiptap blockquote` | 引用块，左侧蓝色边框 + 渐变背景 |
| `.tiptap ul/ol` | 列表 |
| `.tiptap ul[data-type="taskList"]` | 任务列表，flex 布局 |
| `.tiptap hr` | 分隔线 |
| `.tiptap a` | 链接，蓝色强调色 |
| `.tiptap img` | 图片，max-width: 100% |
| `.tiptap table/th/td` | 表格，边框折叠 |

### 特殊块样式

| 类名 | 说明 |
|------|------|
| `.plantuml-block` | PlantUML 容器，绿色渐变背景 |
| `.plantuml-block-input` | PlantUML 输入框 |
| `.plantuml-block-preview` | PlantUML 预览区 |
| `.plantuml-error` | PlantUML 错误信息 |
| `.video-block` | 视频容器 |
| `.video-block-player` | 视频播放器，黑色背景 |

### 可调整大小的媒体

| 类名 | 说明 |
|------|------|
| `.resizable-image` | 图片容器，inline-block |
| `.resizable-video` | 视频容器，inline-block |
| `.resize-handle` | 调整把手，透明，悬停显示 |
| `.resize-handle-left` | 左侧把手 |
| `.resize-handle-right` | 右侧把手 |
| `.resize-handle::after` | 把手指示条，蓝色 4px 宽 |

### 占位符

```css
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--color-text-placeholder);
}
```

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

### 行内公式

```css
.tiptap .math-inline {
  display: inline;
  cursor: pointer;
  padding: 0 2px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.tiptap .math-inline:hover {
  background: var(--color-bg-subtle);
}
```

### 块级公式

| 类名 | 说明 |
|------|------|
| `.math-block` | 公式容器，蓝色渐变背景 |
| `.math-block-input` | 输入框，聚焦时蓝色光环 |
| `.math-block-preview` | 预览区，居中显示 |
| `.math-error` | 错误信息，红色背景 |

---

## CSS Modules

组件级样式使用 CSS Modules，文件名 `*.module.css`。

| 文件 | 组件 |
|------|------|
| `Editor.module.css` | Editor, Toolbar, TableMenu, DragHandle |
| `BubbleToolbar.module.css` | BubbleToolbar |
| `SlashMenu.module.css` | SlashMenu |
| `SourceEditor.module.css` | SourceEditor |
| `ViewToggle.module.css` | ViewToggle |
| `ResizeHandle.module.css` | ResizeHandle |

### Editor.module.css 主要类

| 类名 | 说明 |
|------|------|
| `.wrapper` | 编辑器外层容器，max-width: 800px，box-shadow |
| `.toolbarRow` | 工具栏行，深色背景 (#1c1c1e) |
| `.toolbar` | 工具栏容器，flex wrap |
| `.toolbarBtn` | 工具栏按钮，32x32px，data-active 状态 |
| `.divider` | 分隔线，白色 12% 透明度 |
| `.editorArea` | 编辑区域，min-height: 400px |
| `.tableMenu` | 表格菜单，深色玻璃效果 |
| `.tableMenuBtn` | 表格菜单按钮，gap: 4px |
| `.dragHandle` | 拖动手柄，悬停显示工具提示 |

### SlashMenu.module.css 主要类

| 类名 | 说明 |
|------|------|
| `.container` | 菜单容器，深色玻璃效果 |
| `.groupHeader` | 分组标题，11px 大写 |
| `.groupDivider` | 分组分隔线 |
| `.item` | 菜单项，flex 布局 |
| `.icon` | 图标容器，32x32px |
| `.title` | 标题，14px 白色 |
| `.description` | 描述，12px 半透明 |
