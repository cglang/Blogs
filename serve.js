#!/usr/bin/env node
/**
 * 零依赖静态文件服务器（仅用于本地预览）
 *   node serve.js [--port 5173]
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname);
const DEFAULT_PORT = Number(process.env.PORT) || 5173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".markdown": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

function parsePort() {
  const index = process.argv.indexOf("--port");
  if (index !== -1 && process.argv[index + 1]) {
    const port = Number(process.argv[index + 1]);
    if (Number.isInteger(port) && port > 0) return port;
  }
  return DEFAULT_PORT;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(body);
}

function handle(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "400 Bad Request", { "Content-Type": "text/plain; charset=utf-8" });
  }

  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = path.resolve(ROOT, "." + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "403 Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      return send(res, 404, `404 Not Found: ${pathname}`, {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    });

    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

const port = parsePort();
const server = http.createServer(handle);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[serve] 端口 ${port} 已被占用，请使用 --port 指定其他端口。`);
  } else {
    console.error("[serve]", error.message);
  }
  process.exitCode = 1;
});

server.listen(port, () => {
  console.log(`[serve] 博客预览已启动: http://localhost:${port}/`);
  console.log(`[serve] 静态根目录: ${ROOT}`);
  console.log("[serve] Ctrl+C 停止");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
