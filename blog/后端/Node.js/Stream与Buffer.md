---
title: Node.js 中的 Stream 与 Buffer
description: 理解二进制数据与流式处理，用可读流高效读取大文件。
date: 2025-10-12
tags: [Node.js, Stream, Buffer, 性能]
---

处理大文件时，如果一次性 `readFile`，内存会被瞬间打满。Node.js 提供了 **Buffer** 与 **Stream** 来解决二进制数据与流式处理的问题。

## Buffer 是什么

Buffer 用于表示固定长度的字节序列，是 Node.js 处理二进制数据的基础。

```js
const buf = Buffer.from("你好，世界", "utf8");

console.log(buf.length); // 字节数，不是字符数
console.log(buf.toString("utf8")); // 你好，世界
console.log(buf[0].toString(16)); // 第一个字节的十六进制
```

> 注意：UTF-8 下一个中文字符占 3 个字节，所以 `Buffer.byteLength("你") === 3`。

## 为什么需要 Stream

| 方式 | 内存占用 | 首字节延迟 |
| --- | --- | --- |
| `fs.readFile` | 整个文件 | 读完才返回 |
| 流式读取 | 一个 chunk | 读到第一块即可处理 |

流把数据切成小块（chunk），边读边处理，适合日志、视频、数据库导出等场景。

## 四种流

- `Readable`：可读流，如 `fs.createReadStream`。
- `Writable`：可写流，如 `fs.createWriteStream`。
- `Duplex`：可读可写，如 TCP socket。
- `Transform`：读写过程中转换数据，如 `zlib.createGzip`。

## 用管道复制并压缩文件

```js
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");

async function compress(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output)
  );
  console.log("done");
}

compress("access.log", "access.log.gz").catch(console.error);
```

推荐用 `pipeline` 而不是 `pipe`，因为它会自动处理错误与资源清理。

## 背压（Backpressure）

当写入速度慢于读取速度时，流会产生背压。`pipeline` 已经帮我们处理了：

```js
readable.on("data", (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) {
    readable.pause();
    writable.once("drain", () => readable.resume());
  }
});
```

手动管理背压较繁琐，所以优先使用 `pipeline`。

## 小结

1. Buffer 表示字节，注意编码与字节长度。
2. Stream 用 chunk 分片处理数据，避免大内存占用。
3. 组合流用 `pipeline`，错误处理与背压更省心。
