# Markdown Web Editor 开发文档

基于 TipTap v3 + React 19 + TypeScript 5.9 的富文本编辑器。

## 目录

- [架构概述](./architecture.md)
- [扩展 (Extensions)](./extensions.md)
- [组件 (Components)](./components.md)
- [工具库 (Lib)](./lib.md)
- [样式系统 (Styles)](./styles.md)

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TipTap | 3.20.1 | 编辑器核心 (基于 ProseMirror) |
| Vite | 7 | 构建工具 |
| TypeScript | 5.9 | 类型系统 |
| KaTeX | - | 数学公式渲染 |
| lowlight | - | 代码高亮 |
| markdown-it | - | Markdown 解析 |
| turndown | - | HTML 转 Markdown |
| plantuml-encoder | - | PlantUML 图表编码 |

## 项目结构

```
src/
├── components/Editor/   # React 组件
├── extensions/          # TipTap 扩展
├── lib/                 # 工具函数
├── styles/              # 全局样式
└── types/               # 类型定义
```

## 快速开始

```bash
pnpm install
pnpm dev      # 开发服务器
pnpm build    # 生产构建
```

## 功能列表

| 功能 | 说明 |
|------|------|
| 富文本编辑 | 标题、粗体、斜体、下划线、删除线、代码 |
| 列表 | 无序列表、有序列表、任务列表 |
| 表格 | 插入、编辑、行列操作 |
| 代码块 | 语法高亮 |
| 数学公式 | 行内公式、块级公式 (KaTeX) |
| PlantUML | UML 图表渲染 |
| 媒体 | 图片、视频 (可调整大小) |
| 链接 | 自动识别、粘贴检测 |
| 斜杠命令 | `/` 触发快捷插入 |
| 双视图 | 富文本/Markdown 源码切换 |
