# Markdown Web Editor 开发文档

基于 TipTap 3.20.1 + React 19 + TypeScript 5.9 的富文本编辑器。

## 目录

- [架构概述](./architecture.md)
- [扩展 (Extensions)](./extensions.md)
- [组件 (Components)](./components.md)
- [工具库 (Lib)](./lib.md)
- [样式系统 (Styles)](./styles.md)

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 19.2.4 | UI 框架 |
| TipTap | 3.20.1 | 编辑器核心 (基于 ProseMirror) |
| Vite | 7.3.1 | 构建工具 |
| TypeScript | 5.9.3 | 类型系统 |
| tiptap-markdown | 0.9.0 | Markdown 双向转换 |
| CodeMirror | 6.0.2 | 源码编辑器 |
| KaTeX | 0.16.37 | 数学公式渲染 |
| lowlight | 3.3.0 | 代码高亮 |
| Phosphor Icons | 2.1.10 | 图标库 |
| plantuml-encoder | 1.4.0 | PlantUML 图表编码 |
| tippy.js | 6.3.7 | 弹出菜单定位 |

## 项目结构

```
src/
├── components/Editor/   # React 组件
│   ├── Editor.tsx           # 主编辑器容器
│   ├── Toolbar.tsx          # 顶部工具栏
│   ├── BubbleToolbar.tsx    # 浮动格式工具栏
│   ├── TableMenu.tsx        # 表格操作菜单
│   ├── SlashMenu.tsx        # 斜杠命令菜单
│   ├── SourceEditor.tsx     # CodeMirror 源码编辑器
│   ├── ViewToggle.tsx       # 视图切换按钮
│   ├── ResizeHandle.tsx     # 可复用调整大小组件
│   └── icons.ts             # 图标尺寸配置
├── extensions/          # TipTap 扩展
│   ├── slash-command.tsx    # 斜杠命令扩展
│   ├── math-inline.ts       # 行内数学公式
│   ├── math-block.ts        # 块级数学公式
│   ├── plantuml-block.ts    # PlantUML 图表
│   ├── image.ts             # 可调整大小的图片
│   ├── video-block.ts       # 可调整大小的视频
│   ├── code-block.ts        # 语法高亮代码块
│   ├── link.ts              # 链接
│   ├── underline.ts         # 下划线
│   ├── table.ts             # 表格
│   ├── task-list.ts         # 任务列表
│   ├── custom-keymap.ts     # 自定义快捷键
│   └── index.ts             # 统一导出
├── lib/                 # 工具函数
│   ├── use-markdown-editor.ts       # 编辑器初始化 Hook
│   └── slash-command-suggestion.tsx # 斜杠命令 Suggestion 配置
├── styles/              # 全局样式
│   ├── reset.css            # CSS 变量和重置
│   ├── editor.css           # 编辑器内容样式
│   ├── hljs.css             # 代码高亮样式
│   └── katex.css            # 数学公式样式
└── types/               # 类型定义
    ├── editor.ts            # 编辑器相关类型
    ├── strapi.ts            # Strapi CMS 类型
    └── plantuml-encoder.d.ts # plantuml-encoder 类型声明
```

## 快速开始

```bash
pnpm install
pnpm dev      # 开发服务器
pnpm build    # 生产构建
pnpm lint     # ESLint 检查
```

## 功能列表

| 功能 | 说明 |
|------|------|
| 富文本编辑 | 标题 (H1-H3)、粗体、斜体、下划线、删除线、行内代码 |
| 列表 | 无序列表、有序列表、任务列表 (支持嵌套) |
| 表格 | 插入、编辑、行列操作 (添加/删除行列) |
| 代码块 | lowlight 语法高亮 (common 语言包) |
| 数学公式 | 行内公式 `$...$`、块级公式 `$$...$$` (KaTeX) |
| PlantUML | UML 图表渲染 (500ms 防抖) |
| 媒体 | 图片、视频 (可调整大小 10-100%) |
| 链接 | 自动识别、粘贴检测 |
| 斜杠命令 | `/` 触发快捷插入，支持分组和模糊搜索 |
| 双视图 | 富文本/Markdown 源码切换 (Ctrl+M) |

## UI 设计

- 深色工具栏 (#1c1c1e) + 白色编辑区
- Phosphor Icons 图标库
- Linear 风格玻璃效果 (backdrop-filter blur)
- 150ms ease 过渡动画
