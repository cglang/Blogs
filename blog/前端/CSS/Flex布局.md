---
title: Flex 布局完全指南
description: 用一张思维模型掌握容器属性与项目属性，附常用布局配方。
date: 2025-10-15
tags: [CSS, 布局, Flex]
---

Flex 布局解决的是**一维空间内的排列与对齐**问题。记住一句话：**容器负责分配空间，项目负责自身伸缩**。

## 两根轴

- **主轴（main axis）**：由 `flex-direction` 决定，默认水平向右。
- **交叉轴（cross axis）**：始终垂直于主轴。

```css
.container {
  display: flex;
  flex-direction: row; /* row | row-reverse | column | column-reverse */
}
```

## 容器属性

| 属性 | 作用 |
| --- | --- |
| `justify-content` | 主轴上的对齐方式 |
| `align-items` | 交叉轴上的对齐方式 |
| `flex-wrap` | 是否换行 |
| `gap` | 项目之间的间距 |
| `align-content` | 多行时的行间对齐 |

```css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
```

## 项目属性

```css
.item {
  flex: 1 1 200px; /* grow shrink basis */
  align-self: flex-end;
  order: 2;
}
```

- `flex-grow`：剩余空间如何放大。
- `flex-shrink`：空间不足时如何缩小。
- `flex-basis`：分配前的初始尺寸。

> 推荐用 `flex: 1` 表示「等分剩余空间」，用 `flex: 0 0 auto` 表示「不伸不缩，按内容大小」。

## 常用配方

### 水平垂直居中

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

### 两侧固定、中间自适应

```css
.layout {
  display: flex;
}

.layout .side {
  flex: 0 0 200px;
}

.layout .main {
  flex: 1;
  min-width: 0; /* 防止内容撑破 */
}
```

### 等宽卡片自动换行

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.cards > .card {
  flex: 1 1 240px;
}
```

## 常见坑

- **`min-width: 0`**：flex 项目默认 `min-width: auto`，内容过长会导致无法收缩。
- **`flex-basis` 与 `width`**：同时存在时 `flex-basis` 优先。
- **换行与 `align-items`**：多行时想控制行间距，用 `align-content` 而不是 `align-items`。

## 小结

Flex 的核心是理解主轴与交叉轴，再配合 `flex` 简写控制伸缩。掌握几个常用配方，绝大多数一维布局都能快速搞定。
