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
│  (useMarkdownEditor, markdown-converter)│
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
    ↓
TipTap Editor (ProseMirror)
    ↓
Extensions 处理节点/标记
    ↓
HTML 输出
    ↓
onUpdate 回调 → 外部状态
```

## 视图模式切换

```
Rich Text Mode                Source Mode
     │                            │
     │  Ctrl+M 或点击切换           │
     ↓                            ↓
editor.getHTML()  ────→  htmlToMarkdown()
                              │
                              ↓
                        Markdown 字符串
                              │
markdownToHtml()  ←────  用户编辑
     │
     ↓
editor.setContent()
```

## 目录职责

| 目录                     | 职责                                       |
|--------------------------|--------------------------------------------|
| `src/extensions/`        | TipTap 节点 (Node) 和扩展 (Extension) 定义 |
| `src/components/Editor/` | React UI 组件                              |
| `src/lib/`               | 编辑器初始化 Hook、格式转换工具            |
| `src/styles/`            | CSS 变量、编辑器内容样式                   |
| `src/types/`             | TypeScript 类型定义                        |

## 扩展类型

TipTap 扩展分三类:

| 类型      | 说明           | 示例                       |
|-----------|----------------|----------------------------|
| Node      | 块级或行内节点 | Image, Table, MathBlock    |
| Mark      | 文本修饰       | Underline, Link            |
| Extension | 功能增强       | SlashCommand, CustomKeymap |

## 关键设计

### 1. 可调整大小的媒体

Image 和 VideoBlock 使用自定义 NodeView:
- 创建容器 div + 左右 resize-handle
- mousedown/mousemove/mouseup 事件计算宽度百分比
- 通过 `tr.setNodeMarkup()` 更新节点属性

### 2. 斜杠命令

基于 TipTap Suggestion API:
- 监听 `/` 字符触发
- 使用 Tippy.js 定位弹出菜单
- 支持键盘导航和模糊搜索

### 3. 双视图同步

- Rich Text → Source: `turndown` 库转换
- Source → Rich Text: `markdown-it` 库解析
- 自定义 turndown 规则处理任务列表、代码块、数学公式
