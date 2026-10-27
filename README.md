# CGL Blog · 静态 Markdown 博客预览

一个零框架、纯静态的博客阅读器：左侧是可折叠的文件树，右侧是 GitHub 风格的 Markdown 渲染页。文件树由 Node 脚本扫描 `blog/` 目录生成，Markdown 在浏览器端请求并渲染，支持代码高亮、深浅主题切换、URL 直达与相对链接跳转。

## 特性

- **目录树导航**：文件夹折叠 / 展开，当前文件高亮，支持关键词过滤。
- **静态 JSON 数据**：`data/tree.json` 描述目录、文件、大小与更新时间。
- **前端渲染 Markdown**：marked + DOMPurify，安全地渲染 GFM（表格、任务列表、删除线等）。
- **代码高亮与复制**：highlight.js（GitHub 亮 / 暗配色），代码块悬停显示复制按钮。
- **GitHub 风格界面**：文件树、面包屑、主题、Markdown 排版均对齐 GitHub 的视觉习惯。
- **体验细节**：深浅主题、侧栏宽度拖拽、移动端抽屉、URL Hash 路由、相对图片与 Markdown 内链跳转、阅读时间、文章元信息。
- **离线可用**：所有第三方库已放在 `assets/vendor/`，无需 CDN。

## 快速开始

```bash
# 1. 安装 Node.js >= 18（无需 npm install）
# 2. 生成静态文件树
npm run build

# 3. 启动本地静态服务器
npm start
# 打开 http://localhost:5173/
```

> Markdown 与 `tree.json` 都通过 `fetch` 加载，因此不能直接双击 `index.html`。请使用 `npm start` 或任意静态服务器（如 `python -m http.server 5173`）。

开发时可以同时监听内容变化并自动重建文件树：

```bash
npm run watch   # 终端 1：监听 blog/ 变化
npm start       # 终端 2：启动静态服务器
```

## 目录结构

```text
.
├── index.html                  # 页面骨架 + 内联 SVG 图标
├── blog/                       # 博客内容（Markdown 与相对资源）
│   ├── README.md               # 首页，默认自动打开
│   ├── 前端/
│   │   ├── JavaScript/
│   │   │   ├── 事件循环.md
│   │   │   └── images/event-loop.svg
│   │   └── CSS/Flex布局.md
│   └── ...
├── data/tree.json              # 由脚本生成，请勿手动修改
├── scripts/generate-tree.js    # 扫描 blog/ 生成 tree.json
├── serve.js                    # 零依赖静态服务器
├── assets/
│   ├── css/style.css           # 页面与主题样式
│   ├── js/app.js               # 文件树、路由、Markdown 渲染
│   ├── favicon.svg
│   └── vendor/                 # marked / DOMPurify / highlight.js / GitHub CSS
└── package.json
```

## 写一篇新文章

1. 在 `blog/` 下新建 `.md` 文件（可放在任意层级目录中）。
2. 推荐添加 front matter：

```md
---
title: 文章标题
description: 一句话摘要，会显示在标题下方
date: 2025-10-27
tags: [JavaScript, 浏览器]
---

正文内容……
```

3. 执行 `npm run build` 更新 `data/tree.json`，刷新页面即可看到新文件。

### Front matter 字段

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题，显示在正文顶部与浏览器标签页 |
| `description` / `summary` | 摘要 |
| `date` | 日期，支持 `2025-10-27` 或 ISO 时间 |
| `tags` | 标签，支持 `[a, b]` 或 `a, b` |

没有 front matter 也能正常渲染；如果没有标题，页面直接展示 Markdown 内容。

### 图片与链接

- 图片使用相对路径：`![说明](./images/diagram.svg)`，加载时会自动解析到当前 Markdown 所在目录。
- 引用其他文章使用相对路径：`[事件循环](./前端/JavaScript/事件循环.md)`，点击后会在当前页面内跳转。
- 外部链接自动添加 `target="_blank"` 与 `rel="noopener noreferrer"`。

## 生成脚本

```bash
node scripts/generate-tree.js            # 生成一次
node scripts/generate-tree.js --watch    # 监听变化自动生成
```

可用环境变量覆盖默认路径：

```bash
CONTENT_DIR=posts OUT_FILE=data/tree.json node scripts/generate-tree.js
```

脚本只收录 `.md` / `.markdown` 文件，忽略以 `.` 开头的文件与 `node_modules` 等目录，只保留包含 Markdown 的目录。排序规则为“目录优先，名称使用中文数字排序”。

生成的数据结构：

```json
{
  "generatedAt": "2025-10-27T09:50:00.000Z",
  "contentDir": "blog",
  "stats": { "files": 14, "dirs": 12 },
  "root": {
    "type": "dir",
    "name": "blog",
    "path": "",
    "children": [
      {
        "type": "file",
        "name": "README.md",
        "path": "README.md",
        "size": 2115,
        "mtime": "2025-10-27T09:45:00.000Z"
      }
    ]
  }
}
```

## URL 路由

- `#/`：博客首页（自动打开根目录 `README.md`）
- `#/前端/JavaScript/事件循环.md`：直达文章
- `#/path/to/file.md#section`：直达文章并定位到标题锚点

浏览器前进 / 后退可以正常切换文章。

## 自定义

- **更改内容目录**：修改 `scripts/generate-tree.js` 的 `CONTENT_DIR`（或使用环境变量）后重新生成即可。前端会从 `data/tree.json` 的 `contentDir` 字段自动读取目录名，无需改 JavaScript。
- **支持更多文件类型**：在生成脚本的 `MARKDOWN_EXT` 中增加扩展名，并在前端为点击事件补充对应处理（当前只预览 Markdown）。
- **主题颜色**：在 `assets/css/style.css` 的 `:root` 与 `html[data-theme="dark"]` 中调整 CSS 变量。
- **Markdown 排版**：直接覆盖 `assets/vendor/github-markdown-*.css` 中的 `.markdown-body` 样式，或在 `style.css` 末尾追加。

## 已内置的第三方库

| 库 | 版本 | 用途 |
| --- | --- | --- |
| [marked](https://github.com/markedjs/marked) | 15.0.7 | Markdown → HTML |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.2.4 | HTML 安全清洗 |
| [highlight.js](https://highlightjs.org/) | 11.11.1 | 代码语法高亮 |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | 5.8.1 | GitHub Markdown 排版 |

## 部署

这是一个纯静态站点。部署时上传以下内容即可：

```text
index.html
assets/
data/
blog/
```

如果托管平台支持自定义构建命令，可配置为 `npm run build`，输出目录为项目根目录。

---

用 Markdown 记录，用静态文件交付。
