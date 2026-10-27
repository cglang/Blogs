#!/usr/bin/env node
/**
 * 扫描博客内容目录，生成前端的静态文件树 data/tree.json
 *
 * 用法:
 *   node scripts/generate-tree.js            # 生成一次
 *   node scripts/generate-tree.js --watch    # 监听变化并自动重建
 *   CONTENT_DIR=posts OUT_FILE=data/tree.json node scripts/generate-tree.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = process.env.CONTENT_DIR || "blog";
const OUT_FILE = process.env.OUT_FILE || "data/tree.json";
const CONTENT_ROOT = path.resolve(ROOT, CONTENT_DIR);
const OUT_PATH = path.resolve(ROOT, OUT_FILE);

/** 需要收录的文件扩展名，可按需修改 */
const MARKDOWN_EXT = new Set([".md", ".markdown"]);
/** 忽略的目录/文件（以 . 开头的默认也会忽略） */
const IGNORED = new Set(["node_modules", "__pycache__", "dist", ".git", ".vitepress"]);

const collator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

function shouldIgnore(name) {
  return name.startsWith(".") || IGNORED.has(name);
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function readStat(absPath) {
  try {
    const stat = fs.statSync(absPath);
    return {
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch {
    return { size: 0, mtime: null };
  }
}

let fileCount = 0;
let dirCount = 0;

function buildNode(absPath, relPath) {
  const stat = fs.statSync(absPath);
  const name = path.basename(absPath);

  if (stat.isDirectory()) {
    const entries = fs
      .readdirSync(absPath, { withFileTypes: true })
      .filter((entry) => !shouldIgnore(entry.name));

    const children = [];
    for (const entry of entries) {
      const childAbs = path.join(absPath, entry.name);
      const childRel = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const child = buildNode(childAbs, childRel);
        // 只收集包含 Markdown 的目录，避免出现空目录
        if (child.children.length > 0) children.push(child);
      } else if (entry.isFile() && MARKDOWN_EXT.has(path.extname(entry.name).toLowerCase())) {
        const info = readStat(childAbs);
        children.push({
          type: "file",
          name: entry.name,
          path: childRel,
          size: info.size,
          mtime: info.mtime,
        });
        fileCount += 1;
      }
    }

    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return collator.compare(a.name, b.name);
    });

    if (relPath) dirCount += 1;

    return {
      type: "dir",
      name,
      path: relPath,
      children,
    };
  }

  throw new Error(`入口不是目录: ${absPath}`);
}

function build() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`内容目录不存在: ${CONTENT_ROOT}`);
  }

  fileCount = 0;
  dirCount = 0;
  const root = buildNode(CONTENT_ROOT, "");
  root.name = path.basename(CONTENT_ROOT) || "blog";

  const data = {
    generatedAt: new Date().toISOString(),
    contentDir: CONTENT_DIR,
    stats: {
      files: fileCount,
      dirs: dirCount,
    },
    root,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(
    `[tree] ${fileCount} 个文件, ${dirCount} 个目录 -> ${path.relative(ROOT, OUT_PATH)}`
  );
  return data;
}

function watch() {
  build();
  console.log(`[tree] 正在监听 ${CONTENT_DIR}/ 的变化，Ctrl+C 退出...`);

  let timer = null;
  try {
    fs.watch(CONTENT_ROOT, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          build();
        } catch (error) {
          console.error("[tree] 生成失败:", error.message);
        }
      }, 150);
    });
  } catch (error) {
    console.error("[tree] 当前平台不支持递归监听:", error.message);
    process.exitCode = 1;
  }
}

try {
  if (process.argv.includes("--watch") || process.argv.includes("-w")) {
    watch();
  } else {
    build();
  }
} catch (error) {
  console.error("[tree] 生成失败:", error.message);
  process.exitCode = 1;
}
