# 架构概述

## 分层结构

```
┌─────────────────────────────────────────┐
│              App.tsx                    │  入口
├─────────────────────────────────────────┤
│           Components Layer              │  UI 组件
│  (Editor, Toolbar, BubbleToolbar, ...)  │
├─────────────────────────────────────────┤
│             Library Layer               │  工具层
│  (useMarkdownEditor, slashCommandSuggestion)
├─────────────────────────────────────────┤
│           Extensions Layer              │  扩展层
│  (Image, Table, MathBlock, ...)         │
├─────────────────────────────────────────┤
│         TipTap / ProseMirror            │  编辑器核心
└─────────────────────────────────────────┘
```

## 数据流

```
用户输入
    │
    ▼
TipTap Editor (ProseMirror)
    │
    ▼
Extensions 处理节点/标记
    │
    ▼
tiptap-markdown 序列化
    │
    ▼
onUpdate 回调 → 返回 Markdown 字符串
```

## 视图模式切换

使用 tiptap-markdown 直接在 ProseMirror 文档模型上转换:

```
Rich Text Mode                    Source Mode (CodeMirror 6)
     │                                 │
     │  Ctrl+M 或点击切换               │
     ▼                                 ▼
editor.storage.markdown ────→   Markdown 字符串
    .getMarkdown()                     │
                                       │
editor.commands ←──────────────  用户编辑
    .setContent(markdown)
```

## 目录职责

| 目录 | 职责 |
|------|------|
| `src/extensions/` | TipTap 节点 (Node) 和扩展 (Extension) 定义 |
| `src/components/Editor/` | React UI 组件 |
| `src/lib/` | 编辑器初始化 Hook、Suggestion 配置 |
| `src/styles/` | CSS 变量、编辑器内容样式 |
| `src/types/` | TypeScript 类型定义 |

## 扩展类型

TipTap 扩展分三类:

| 类型 | 说明 | 示例 |
|------|------|------|
| Node | 块级或行内节点 | Image, Table, MathBlock, VideoBlock |
| Mark | 文本修饰 | Underline, Link |
| Extension | 功能增强 | SlashCommand, CustomKeymap |

## 关键设计

### 1. Markdown 双向转换

使用 tiptap-markdown 扩展:
- 配置 `html: true` 允许原始 HTML (用于 Image/VideoBlock 保留 width)
- 配置 `transformPastedText: true` 粘贴时转换
- 配置 `transformCopiedText: true` 复制时转换
- 自定义扩展通过 `addStorage().markdown` 定义序列化/解析规则

### 2. 可调整大小的媒体

Image 和 VideoBlock 使用自定义 NodeView:
- 创建容器 div + 左右 resize-handle
- mousedown/mousemove/mouseup 事件计算宽度百分比
- 通过 `tr.setNodeMarkup()` 更新节点属性
- 宽度范围: 10% - 100%
- 序列化为 `<img width="50%">` / `<video width="50%">` 格式

### 3. 斜杠命令

基于 TipTap Suggestion API:
- 监听 `/` 字符触发
- 使用 Tippy.js 定位弹出菜单 (placement: bottom-start)
- 支持键盘导航 (ArrowUp/Down, Enter, Escape)
- 命令分组: text, list, block, media, advanced
- 模糊搜索过滤

### 4. 双视图同步

- Rich Text → Source: `editor.storage.markdown.getMarkdown()`
- Source → Rich Text: `editor.commands.setContent(markdownString)`
- 快捷键: `Ctrl+M` 切换视图
- Source 编辑器使用 CodeMirror 6 + Markdown 语言支持

### 5. 图标系统

使用 Phosphor Icons (`@phosphor-icons/react`):
- 工具栏按钮: 18px (`ICON_SIZE`)
- 浮动菜单: 16px (`ICON_SIZE_SM`)
- 斜杠菜单: 20px (`SLASH_ICON_SIZE`)
- 表格菜单: 14px (`TABLE_ICON_SIZE`)
