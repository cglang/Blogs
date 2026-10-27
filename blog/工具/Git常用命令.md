---
title: Git 常用命令速查
description: 覆盖日常开发最常用的 Git 命令，包括分支、撤销、变基与日志排查。
date: 2025-10-08
tags: [Git, 工具, 版本控制]
---

这份速查表按使用场景整理，适合放在手边随时查阅。

## 基础操作

```bash
git status                 # 查看工作区状态
git add -A                 # 添加全部改动
git commit -m "feat: ..."  # 提交
git log --oneline -10      # 最近 10 条提交
git diff                   # 查看未暂存改动
git diff --staged          # 查看已暂存改动
```

## 分支管理

```bash
git switch -c feature/login     # 新建并切换分支
git switch main                 # 切回主分支
git branch -a                   # 查看所有分支
git branch -d feature/login     # 删除已合并分支
git merge feature/login         # 合并分支
```

## 撤销与回退

| 场景 | 命令 |
| --- | --- |
| 撤销工作区文件改动 | `git restore file.js` |
| 取消暂存 | `git restore --staged file.js` |
| 修改最近一次提交 | `git commit --amend` |
| 回退提交但保留改动 | `git reset --soft HEAD~1` |
| 回退提交并丢弃改动 | `git reset --hard HEAD~1` |
| 撤销已推送的提交 | `git revert <commit>` |

> `reset --hard` 会丢失未提交内容，操作前先确认 `git status`。

## 变基与整理历史

```bash
git fetch origin
git rebase origin/main       # 把当前分支变基到最新 main
git rebase -i HEAD~3         # 交互式整理最近 3 次提交
git rebase --abort           # 变基冲突时放弃
```

交互式变基支持 `pick`、`squash`、`reword`、`drop`，是整理提交记录的好帮手。

## 远程协作

```bash
git remote -v
git pull --rebase origin main
git push -u origin feature/login
git push --force-with-lease   # 比 --force 更安全
```

## 排查问题

```bash
git stash push -m "wip"        # 临时保存改动
git stash list
git stash pop
git blame src/app.js           # 查看每行最后修改者
git log -S "keyword" -p        # 搜索引入关键词的提交
git bisect start               # 二分定位引入 bug 的提交
```

## 小结

记住三个原则：**提交前先看 diff、改写历史只动本地分支、强推用 `--force-with-lease`**。掌握这些命令，日常协作基本无碍。
