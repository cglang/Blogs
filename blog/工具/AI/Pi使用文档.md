---
title: Pi 使用文档
description: Pi 终端 AI 编码代理的安装、交互式使用、命令行模式、配置与自定义的完整指南
date: 2025-10-28
tags: [Pi, AI Agent, CLI, 工具]
---

# Pi 使用文档

Pi 是一个运行在终端里的可扩展 AI 代理。给它一个目标和一份工作目录，它就能读取文件、执行命令、编辑内容，并逐步完成多步任务。Pi 开箱自带强大的默认能力，同时可以通过扩展（extensions）、技能（skills）、提示模板（prompt templates）和主题（themes）高度定制，并打包成 Pi 包（packages）通过 npm 或 git 分发。

> 官方文档：<https://pi.dev> · 源码：<https://github.com/earendil-works/pi>

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [交互式使用](#交互式使用)
- [斜杠命令速查](#斜杠命令速查)
- [模型与提供方](#模型与提供方)
- [会话管理](#会话管理)
- [命令行模式（CLI）](#命令行模式cli)
- [配置](#配置)
- [自定义与扩展](#自定义与扩展)
- [安全与项目信任](#安全与项目信任)
- [环境变量](#环境变量)
- [常用快捷键速查](#常用快捷键速查)

---

## 安装

Pi 需要 Node.js 22.19 或更高版本。macOS 和 Linux 的安装器可以自动安装 Node。

### 官方安装器（推荐，会固定所有依赖）

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

之后用 `pi update` 更新 Pi。Windows：

```powershell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

### npm 安装（不固定传递依赖）

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

### Nix 安装

```bash
nix profile add github:earendil-works/pi/stable
```

验证安装：

```bash
pi --version
```

### 卸载

- npm 安装：`npm uninstall -g @earendil-works/pi-coding-agent`
- 安装器：重新运行安装脚本并选择 **Uninstall Pi**
- Nix：`nix profile remove pi`

卸载不会删除 `~/.pi/agent/` 下的配置、凭据、会话和已安装的包。

---

## 快速开始

```bash
cd /path/to/project
pi
```

1. 首次启动后运行 `/login`，选择一个提供方（provider），连接订阅或存储 API Key。
2. 用 `/model` 选择模型。
3. 直接输入任务，例如：

```text
总结 @meeting-notes.md 并把待办事项保存到 action-items.md。
```

```text
解释这个仓库的结构，以及如何运行它的检查。
```

输入 `@` 可以在编辑器中搜索文件而不是输入完整路径；按 `Tab` 补全路径；可以粘贴图片或拖入兼容的终端。

---

## 交互式使用

运行 `pi` 后，界面分为三部分：会话记录（transcript）、编辑器（输入框）、底部状态栏（当前目录、模型、会话、上下文用量、费用）。Pi 会展示每一次文件读取、搜索、命令和编辑，它**不会在每次工具调用前询问确认**。

### 输入提示

| 操作 | 说明 |
| --- | --- |
| 输入文字后 `Enter` | 发送提示 |
| `Shift+Enter` 或 `Ctrl+J` | 插入换行 |
| `Ctrl+G` | 在外部编辑器中编写长提示 |
| 输入 `@` | 搜索文件并添加到提示 |
| `Tab` | 补全路径 |

### 关注 Pi 的工作

| 操作 | 说明 |
| --- | --- |
| `Ctrl+O` | 展开 / 折叠工具输出 |
| `Ctrl+T` | 显示 / 隐藏思考（thinking）块 |

### 调整方向（工作进行中仍可输入）

| 想做什么 | 操作 |
| --- | --- |
| 调整当前任务 | 输入消息后按 `Enter` |
| 当前任务完成后再追加工作 | 输入消息后按 `Alt+Enter` |
| 把排队消息退回编辑器 | `Alt+Up` |
| 停止当前任务 | `Escape` |

用 `Enter` 发送的消息会等待当前回复及其工具调用完成后，再指导下一次回复；用 `Alt+Enter` 发送的后续消息会等 Pi 完成当前任务后再进入。中止任务会把排队消息退回编辑器。

> Windows Terminal 保留了一些 Alt 快捷键，替代键见 [终端设置](https://pi.dev/docs/terminal-setup)。

### 运行终端命令

| 命令 | 说明 |
| --- | --- |
| `!git status` | 执行命令并把输出加入会话 |
| `!!npm test` | 执行命令但**不**把输出发给模型 |

### 复制、导出、分享

| 操作 | 说明 |
| --- | --- |
| `Ctrl+X` 或 `/copy` | 复制最后一条助手回复 |
| `/export` | 将会话导出为 HTML 或 JSONL |
| `/share` | 上传会话并获取查看链接 |

> 导出或分享前请先检查会话，它可能包含提示词、工具输出、文件内容和暴露的凭据。

### 调整终端

全屏模式（默认）让编辑器和状态栏固定，transcript 在窗口内滚动；普通模式使用终端本身的滚动缓冲。通过 `/settings` 或 `--tui-mode` 切换。`/hotkeys` 查看当前会话的快捷键，`/debug` 收集诊断信息（写入 agent 目录下的 `pi-debug.log`）。

---

## 斜杠命令速查

在编辑器中输入 `/` 可以搜索当前会话可用的命令。扩展、提示模板和技能可以增加更多命令。

### 模型与设置

| 命令 | 说明 |
| --- | --- |
| `/settings` | 打开设置 |
| `/model [provider/model]` | 选择模型 |
| `/thinking [level]` | 设置思考等级 |
| `/scoped-models` | 配置循环切换的模型 |
| `/login [provider]` | 添加提供方认证 |
| `/logout` | 移除提供方认证 |
| `/llama` | 管理 llama.cpp 路由上的模型 |

### 会话与上下文

| 命令 | 说明 |
| --- | --- |
| `/new` | 新建会话 |
| `/resume` | 切换到另一个已保存会话 |
| `/name [name]` | 设置会话显示名 |
| `/session` | 显示当前会话信息与统计 |
| `/tree` | 会话树导航 |
| `/fork` | 从更早的用户消息创建新会话 |
| `/clone` | 复制当前会话 |
| `/compact [instructions]` | 压缩当前上下文 |
| `/import <path>` | 导入并恢复 JSONL 会话 |

### 导出与分享

| 命令 | 说明 |
| --- | --- |
| `/copy` | 复制最后一条助手消息 |
| `/export [path]` | 导出会话为 HTML 或 JSONL |
| `/share` | 上传会话并返回查看链接 |
| `/bug [description]` | 生成私有 bug 报告 |

### 运行时与项目

| 命令 | 说明 |
| --- | --- |
| `/trust` | 保存项目信任决定 |
| `/reload` | 重载快捷键、扩展、技能、模板、主题和上下文文件 |
| `/hotkeys` | 显示活动快捷键 |
| `/changelog` | 显示更新日志 |
| `/quit` | 退出 Pi |

---

## 模型与提供方

- **模型（model）** 生成回复；**提供方（provider）** 是 Pi 访问模型的账号或服务。
- `/login` 选择提供方并连接订阅或 API Key；`/logout` 移除凭据。
- `/model` 搜索可用模型（选择器只显示提供方凭据可用的模型）。
- `/thinking` 选择思考等级（`off` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`）。
- `Ctrl+P` 循环切换模型，`Ctrl+S` 保存默认模型或思考等级。

### 连接方式

| 你拥有的 | 推荐方式 |
| --- | --- |
| 支持的订阅 | `/login` 登录 |
| 提供方 API Key | `/login` 存储，或设置环境变量（如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`） |
| 本地 GGUF 模型 | 连接 llama.cpp 路由 |
| OpenAI / Anthropic / Google 兼容端点 | 在 `models.json` 中配置 |
| 自定义协议或认证流程 | 构建或安装 provider 扩展 |

### 配置兼容端点（models.json）

```json
{
  "$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

凭据按优先级解析：命令行 `--api-key` → `auth.json` → `models.json` 的 `apiKey` → 环境变量 / 云端凭据。

---

## 会话管理

Pi 默认自动保存会话（JSONL 文件，树形结构）。每个分支是树中的一条路径，活动分支提供下一次请求的历史。

### 常用会话命令

```bash
pi --continue     # 从当前目录最近会话继续
pi --resume       # 打开会话选择器
```

| 操作 | 结果 | 使用场景 |
| --- | --- | --- |
| `/tree` | 在当前会话文件内移动 | 相关备选方案放在一起 |
| `/fork` | 从更早消息创建新会话 | 备选方案应成为独立工作 |
| `/clone` | 把活动分支复制成新会话 | 想要当前状态的独立副本 |

### 上下文压缩

模型只接收活动分支（不是所有分支）。上下文接近模型上限时 Pi 会自动压缩（compaction）：插入摘要、保留最近消息，**不删除**原始会话条目。可手动运行 `/compact`，或通过设置控制阈值。

### 导出与分享

`/export` 导出为 HTML/JSONL；`/share` 上传获取链接（默认 Radius，否则私有 GitHub gist）。`/bug` 生成私有 bug 报告。

---

## 命令行模式（CLI）

```sh
pi [options] [--] [@files...] [messages...]
pi install <source> [options]
pi update [target] [options]
pi list
pi config [options]
pi auth <check|print-api-key|print-bearer-token> [options]
pi mcp <list|login|logout> [options]
```

运行 `pi --help` 查看精确接口（含扩展注册的选项）。

### 调用与输出

```sh
pi                                            # 终端 UI
pi --print "总结这个仓库"                       # 一次性执行，输出最终文本后退出
git diff | pi --print "审查这次改动"            # 管道输入前置到提示词
pi --mode json "检查这个仓库" > events.jsonl    # JSONL 事件流
```

| 选项 | 行为 |
| --- | --- |
| `-p`, `--print` | 执行提示词，把最终助手文本写入 stdout 后退出 |
| `--mode text` | 文本输出；stdin/stdout 都是终端时仍打开 UI |
| `--mode json` | 执行提示词，输出 JSONL 事件后退出 |
| `--mode rpc` | 从 stdin 读 JSONL 命令，向 stdout 写响应与事件直到关闭 |
| `--export <input> [output]` | 导出会话为 HTML 后退出 |

输入约定：`message` 提供初始提示；`@path` 在首个提示中包含文件或图片；管道 stdin 前置到首个提示；`--` 停止选项解析（提示词以 `-` 开头时使用）。

### 模型选项

```sh
pi --model sonnet:high
pi --list-models [search]
```

| 选项 | 说明 |
| --- | --- |
| `--provider <name>` | 把 `--model` 查找限制到某个提供方（需配合 `--model`） |
| `--model <pattern>` | 按精确 ID 或模糊 ID/名称选择，支持 `provider/id` 与 `:<thinking>` 后缀 |
| `--api-key <key>` | 非持久的 API Key 覆盖（需配合 `--model`/`--models`） |
| `--thinking <level>` | 设置思考等级 |
| `--models <patterns>` | 逗号分隔的启动与循环切换范围 |
| `--list-models [search]` | 列出可用模型后退出 |

### 会话选项

```sh
pi --continue
```

| 选项 | 说明 |
| --- | --- |
| `-c`, `--continue` | 继续当前项目最近会话 |
| `-r`, `--resume` | 打开会话选择器 |
| `--session <path\|id>` | 按路径 / 精确 ID / 部分 ID 打开 |
| `--session-id <id>` | 打开精确项目会话 ID（不存在则创建） |
| `--fork <path\|id>` | 从现有会话派生新会话 |
| `--session-dir <dir>` | 覆盖会话存储与查找 |
| `--no-session` | 使用不持久化的内存会话 |
| `-n`, `--name <name>` | 设置会话显示名 |

### 工具选项

默认启用的工具：`read`、`bash`、`edit`、`write`。

```sh
pi --tools read,grep,find,ls --print "审查这个项目"
```

| 选项 | 说明 |
| --- | --- |
| `-t`, `--tools <list>` | 逗号分隔的允许列表（普通名称替换默认选择；`+name`/`-name` 在默认选择上增减） |
| `-xt`, `--exclude-tools <list>` | 在所有选择之后禁用指定工具 |
| `-nbt`, `--no-builtin-tools` | 禁用内置工具，保留扩展与自定义工具 |
| `-nt`, `--no-tools` | 禁用所有内置、扩展、自定义与 MCP 工具 |

内置工具：`read`（读文件/图片）、`bash`（执行命令）、`powershell`（Windows）、`edit`（精确文本替换）、`write`（创建/覆盖文件）、`grep`（搜索内容）、`find`（glob 查找路径）、`ls`（列目录）。

内置扩展还提供 `codemode`（在 QuickJS 沙箱中运行 JavaScript，可并行调用工具、过滤大输出、调用分类器与图像模型）和 `tool_search`（搜索并声明未暴露的工具），默认关闭，可这样启用：

```json
{ "defaultTools": ["+codemode"] }
```

### 资源选项

```sh
pi --extension ./review.ts
pi --skill ./skill-dir
pi --theme ./theme.json
```

| 选项 | 说明 |
| --- | --- |
| `-e`, `--extension <path>` | 加载扩展文件/目录或内置扩展（如 `builtin:mcp`），可重复 |
| `-ne`, `--no-extensions` | 禁用发现的、配置的和内置的扩展 |
| `--no-mcp` | 禁用内置 MCP 支持 |
| `--skill <path>` | 加载技能，可重复 |
| `-ns`, `--no-skills` | 禁用技能 |
| `--prompt-template <path>` | 加载提示模板，可重复 |
| `-np`, `--no-prompt-templates` | 禁用提示模板 |
| `--theme <path>` / `--use-theme <name>` | 加载 / 选择主题 |
| `--no-themes` | 禁用主题 |
| `-nc`, `--no-context-files` | 禁用 `AGENTS.md` 与 `CLAUDE.md` 发现 |

### 提示词与进程选项

| 选项 | 说明 |
| --- | --- |
| `--system-prompt <text\|path>` | 替换默认系统提示 |
| `--append-system-prompt <text\|path>` | 追加系统提示，可重复 |
| `--tui-mode <mode>` | `fullscreen`（默认）或 `regular` |
| `--verbose` | 显示详细启动信息 |
| `-a`, `--approve` | 信任本项目配置与资源 |
| `-na`, `--no-approve` | 忽略受信任门控的项目配置与资源 |
| `--offline` | 禁用自动网络活动（等同 `PI_OFFLINE=1`） |
| `-h`, `--help` / `-v`, `--version` | 帮助 / 版本 |

### 包命令

| 任务 | 命令 |
| --- | --- |
| 安装包 | `pi install <source>` |
| 列出已配置包 | `pi list` |
| 移除包 | `pi remove <source>` |
| 配置包的资源加载 | `pi config` |
| 更新 Pi | `pi update` |
| 更新所有包 | `pi update --extensions` |
| 更新单个包 | `pi update <source>` |
| 刷新模型目录 | `pi update --models` |
| 更新 Pi 与所有包 | `pi update --all` |

`pi uninstall <source>` 是 `pi remove` 的别名；加 `--local`/`-l` 使用项目设置而非全局设置；`pi update --force` 强制重装 Pi。

### 凭据命令

```sh
pi auth check --provider openai --json
pi auth print-api-key --model <model>
pi auth print-bearer-token --model <model> --min-expiry 30m
```

`auth check` 输出 `ready` / `not_ready` / `invalid`，退出码分别为 `0` / `1` / `2`。凭据打印命令会向 stdout 输出密钥，注意保密。

### MCP 命令

```sh
pi mcp add <server> -- <command> [args...]
pi mcp add <server> --url <url>
pi mcp remove <server>
pi mcp list [--json]
pi mcp login <server> [--timeout <seconds>]
pi mcp logout <server>
```

`add`/`remove` 修改 `~/.pi/agent/mcp.json`，加 `--local` 使用当前目录的 `.pi/mcp.json`。`add` 还支持 `--exposure <mode>` 与 `--description <text>`，且不主动连接；用 `pi mcp list` 检查服务器状态。

---

## 配置

Pi 有用户级（agent 目录，默认 `~/.pi/agent`）与项目级（工作目录下的 `.pi`）配置。交互模式用 `/settings` 修改常用偏好，改完文件后运行 `/reload` 生效。

### Agent 目录

| 路径 | 作用 |
| --- | --- |
| `<agent-dir>/settings.json` | 用户设置、偏好、默认值、资源路径、包声明 |
| `<agent-dir>/keybindings.json` | 自定义快捷键 |
| `<agent-dir>/mcp.json` | 全局 MCP 服务器 |
| `<agent-dir>/models.json` | 兼容端点、模型、模型覆盖 |
| `<agent-dir>/auth.json` | 保存的 API Key 与 OAuth 凭据 |
| `<agent-dir>/AGENTS.md` / `CLAUDE.md` | 跨目录应用的用户指令 |
| `<agent-dir>/SYSTEM.md` | 替换默认系统提示 |
| `<agent-dir>/APPEND_SYSTEM.md` | 向系统提示追加指令 |
| `<agent-dir>/extensions/` · `skills/` · `prompts/` · `themes/` | 用户级资源 |

### 项目 `.pi` 目录

项目 `.pi` 目录结构与 agent 目录类似：`.pi/settings.json`、`.pi/mcp.json`、`.pi/SYSTEM.md`、`.pi/APPEND_SYSTEM.md`、`.pi/extensions/`、`.pi/skills/`、`.pi/prompts/`、`.pi/themes/`。同名文件中，受信任的项目 `SYSTEM.md`/`APPEND_SYSTEM.md` 优先于 agent 目录文件（不合并）。

### 上下文文件（AGENTS.md）

上下文文件与 `.pi` 配置不同，Pi 会从 agent 目录、工作目录及其父目录加载。上下文文件在其所在目录及所有子目录下生效。

- `AGENTS.override.md` 只替换同目录的 `AGENTS.md`/`CLAUDE.md`，不压制其他目录的上下文文件。
- 上下文文件发现**不需要**项目信任。

### 常用 settings.json 项

```json
{
  "$schema": "https://pi.dev/schemas/settings.schema.json",
  "defaultModel": "sonnet",
  "defaultThinkingLevel": "medium",
  "defaultTools": ["+codemode"],
  "theme": "system",
  "tuiMode": "fullscreen",
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

其他重要设置：`defaultProjectTrust`（`ask`/`always`/`never`，只能在 agent 目录设置）、`sessionDir`、`sessionShareDestination`、`externalEditor`、`shellPath`、`httpProxy`、`enableSkillCommands` 等。完整列表见官方 [Settings 参考](https://pi.dev/docs/settings)。

---

## 自定义与扩展

按“从最轻量的机制开始”的原则选择：

| 需求 | 起点 |
| --- | --- |
| 给某目录持久指令 | [`AGENTS.md`](#上下文文件agentsmd) |
| 从 `/` 菜单复用提示词 | 提示模板（prompt template） |
| 任务相关指令与支持文件 | 技能（skill） |
| 可执行工具、命令、事件处理器 | 扩展（extension） |
| 自定义终端组件 | 终端 UI（TUI） |
| 连接不支持的模型服务 | 自定义 provider |
| 安装/分发多种资源 | Pi 包（package） |

- **技能**：按需加载指令与支持文件，可通过 `/skill:name` 调用（`enableSkillCommands` 控制）。
- **提示模板**：可复用的消息文本，作为斜杠命令暴露。
- **扩展**：TypeScript 模块，注册工具、命令、快捷键、provider、事件处理器、渲染器和终端 UI。
- **主题**：终端配色。
- **Pi 包**：把这些资源打包，通过 npm 或 git 分发。

---

## 安全与项目信任

> 把模型生成的命令和代码视为不可信。Pi 可以用启动它的账户权限读取、修改和执行文件，且不会在每次工具调用前询问。扩展、包安装器、语言服务器等子进程拥有相同权限。

安全来自限制 Pi 能访问和影响的范围：

| Pi 如何运行 | 受保护的内容 |
| --- | --- |
| 直接用操作系统用户权限运行 | 该用户无法访问的内容 |
| 完全在容器 / 虚拟机 / 沙箱内运行 | 未暴露给环境的主机文件与进程（通常最强） |
| 隔离环境外运行、仅内置工具在内部运行 | 通过工具执行的动作不触及主机资源 |

建议：只提供任务所需的文件与服务；重要工作前用快照、备份或版本控制；加载扩展和包前先审查；使用作用域窄、短期有效的凭据；审查 diff 与生成结果；导出/分享会话前先检查。

### 项目信任

项目信任控制 Pi 是否加载工作目录提供的设置和资源，防止文件夹在批准前静默加载可执行扩展。受信任保护的资源包括 `.pi/settings.json`、`.pi/mcp.json`、`.pi/` 下的扩展/技能/提示/主题、`.pi/SYSTEM.md`、`.pi/APPEND_SYSTEM.md` 等。

决定顺序：命令行 `--approve`/`--no-approve` → 扩展的 `project_trust` 事件 → `~/.pi/agent/trust.json` 中已保存的决定 → `defaultProjectTrust`（默认 `ask`）。用 `/trust` 保存决定。

注意：项目信任**不是**完整的安全边界，也不限制工具调用能访问的范围；`AGENTS.md`/`CLAUDE.md` 无论是否信任都会加载，应视为不可信输入。Print/JSON/RPC 模式无法显示交互式信任提示，需要用 `--approve`/`--no-approve` 或 `defaultProjectTrust` 显式决定。

---

## 环境变量

### Pi 进程配置

| 变量 | 说明 |
| --- | --- |
| `PI_CODING_AGENT_DIR` | 覆盖配置目录（默认 `~/.pi/agent`） |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储（被 `--session-dir` 覆盖） |
| `PI_PACKAGE_DIR` | 覆盖包目录 |
| `PI_OFFLINE` | 禁用自动网络活动 |
| `PI_SKIP_VERSION_CHECK` | 禁用版本检查 |
| `PI_TELEMETRY` | 覆盖遥测与 provider 归属头 |
| `PI_CODEMODE_MAX_WORKERS` | codemode worker 上限（默认 2） |
| `PI_CACHE_RETENTION` | `long` 启用扩展的 prompt 缓存 |
| `VISUAL`, `EDITOR` | 外部编辑器回退 |
| `HTTP_PROXY`, `HTTPS_PROXY` | 出站 HTTP 请求代理 |

提供方凭据（如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`）见官方 Providers 文档。

### 进程标记与 Shell 工具会话环境

Pi 设置 `AI_AGENT=pi` 与 `PI_CODING_AGENT=true`。`bash`/`powershell` 工具执行的命令会收到会话状态：

| 变量 | 说明 |
| --- | --- |
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 会话 JSONL 文件绝对路径（临时会话为空） |
| `PI_PROVIDER` | 当前模型提供方 |
| `PI_MODEL` | 当前模型 ID |
| `PI_REASONING_LEVEL` | 当前思考等级 |

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
```

---

## 常用快捷键速查

完整列表见 `/hotkeys` 与官方 [Keybindings 参考](https://pi.dev/docs/keybindings)。自定义快捷键写到 `<agent-dir>/keybindings.json`，例如：

```json
{
  "$schema": "https://pi.dev/schemas/keybindings.schema.json",
  "app.session.new": "ctrl+shift+n"
}
```

### 输入与编辑

| 快捷键 | 说明 |
| --- | --- |
| `Enter` | 发送 |
| `Shift+Enter` / `Ctrl+J` | 换行 |
| `Ctrl+G` | 外部编辑器 |
| `Ctrl+W` / `Alt+Backspace` | 删除前一个词 |
| `Ctrl+U` / `Ctrl+K` | 删除到行首 / 行尾 |
| `Ctrl+Y` | 粘贴最近删除的文本 |
| `Ctrl+C` | 复制选中（或清空编辑器） |
| `Ctrl+D` | 编辑器为空时退出 |

### 应用与消息

| 快捷键 | 说明 |
| --- | --- |
| `Escape` | 取消 / 中止 |
| `Ctrl+O` | 折叠/展开工具输出 |
| `Ctrl+T` | 折叠/展开思考块（或切换思考等级） |
| `Ctrl+L` | 打开模型选择器 |
| `Ctrl+P` | 循环下一个模型 |
| `Shift+Tab` | 循环思考等级 |
| `Ctrl+X` | 复制最后助手消息 |
| `Alt+Enter` | 排队后续消息 |
| `Alt+Up` | 退回排队消息 |
| `Ctrl+P` | 切换路径显示（会话选择器内） |
| `Ctrl+V` | 粘贴文件/图片/文本 |

### 全屏模式（transcript 滚动）

| 快捷键 | 说明 |
| --- | --- |
| `PageUp` / `PageDown` | 上/下翻页 |
| `Ctrl+Shift+Up` / `Ctrl+Shift+Down` | 跳到上/下一个标记消息 |
| `Ctrl+Shift+F` | 搜索 transcript |
| `Ctrl+Home` / `Ctrl+End` | 顶部 / 底部 |

---

## 参考链接

- 官方文档：<https://pi.dev>
- 模型目录：<https://pi.dev/models>
- 源码与安全策略：<https://github.com/earendil-works/pi>
- 完整文档页：安装后查看 `@earendil-works/pi-coding-agent/docs/` 目录，或 `pi --help`。
