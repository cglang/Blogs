---
title: CGL 技术博客
description: 记录前端、后端、工程化与算法学习路上的思考与实践。
date: 2025-10-27
tags: [博客, 导航, Markdown]
---

欢迎来到 **CGL 技术博客**。这里收集了日常开发中的笔记、源码分析与工程实践，左侧文件树按照主题分类，点击任意 Markdown 文件即可在右侧预览。

> 提示：页面完全由静态文件驱动，Markdown 在浏览器端解析，代码块支持语法高亮和一键复制。

## 快速导航

| 主题 | 内容 |
| --- | --- |
| [前端](./前端/JavaScript/事件循环.md) | JavaScript、CSS、React、TypeScript |
| [后端](./后端/Node.js/Stream与Buffer.md) | Node.js、数据库 |
| [算法](./算法/排序算法.md) | 排序、动态规划 |
| [工具](./工具/Git常用命令.md) | Git、Docker、Linux |

## 项目结构

```text
blog/
├── README.md                 # 当前页面
├── 前端/
│   ├── JavaScript/
│   │   ├── 事件循环.md
│   │   └── 闭包与作用域.md
│   └── CSS/
│       └── Flex布局.md
├── 后端/
│   └── Node.js/
│       └── Stream与Buffer.md
└── 工具/
    └── Git常用命令.md
```

## 工作流程

```mermaid
graph LR
  A[编写 Markdown] --> B[生成 tree.json]
  B --> C[浏览器加载]
  C --> D[marked 渲染]
  D --> E[highlight.js 高亮]
```

> 上面是普通代码块示例（未接入 mermaid 渲染），用于演示代码块样式。

## 一段示例代码

```js
// 解析 Markdown 并高亮代码块
const html = marked.parse(markdown);
document.querySelector('.markdown-body').innerHTML = DOMPurify.sanitize(html);
document.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
```

## 待办清单

- [x] 支持文件夹折叠 / 展开
- [x] 支持代码块语法高亮
- [x] 支持 URL 直达（`#/前端/CSS/Flex布局.md`）
- [ ] 接入全文搜索
- [ ] 自动部署到静态托管平台

---

### 关于本站

站点由纯 HTML / CSS / JavaScript 构建，无前端框架依赖。文件树由 Node 脚本扫描 `blog/` 目录生成，新增文章后执行：

```bash
npm run build
```

即可刷新左侧目录。
