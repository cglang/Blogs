/**
 * CGL Blog · 静态博客预览
 * 依赖：marked（Markdown 解析）、DOMPurify（HTML 清洗）、highlight.js（代码高亮）
 */
(function () {
  "use strict";

  /* ============================================================
   * 常量与状态
   * ============================================================ */
  const CONTENT_DIR = "blog";
  const TREE_URL = "data/tree.json";
  const SVG_NS = "http://www.w3.org/2000/svg";

  const STORAGE = {
    theme: "cgl-blog:theme",
    sidebarWidth: "cgl-blog:sidebar-width",
    openFolders: "cgl-blog:open-folders",
  };

  const els = {
    sidebar: document.getElementById("sidebar"),
    tree: document.getElementById("tree"),
    treeFilter: document.getElementById("tree-filter"),
    clearFilter: document.getElementById("clear-filter"),
    treeSummaryText: document.getElementById("tree-summary-text"),
    treeGenerated: document.getElementById("tree-generated"),
    reloadTree: document.getElementById("reload-tree"),
    homeLink: document.getElementById("home-link"),
    aboutLink: document.getElementById("about-link"),
    themeToggle: document.getElementById("theme-toggle"),
    resizer: document.getElementById("resizer"),
    breadcrumb: document.getElementById("breadcrumb"),
    headActions: document.getElementById("head-actions"),
    copyPath: document.getElementById("copy-path"),
    rawLink: document.getElementById("raw-link"),
    contentScroll: document.getElementById("content-scroll"),
    docMeta: document.getElementById("doc-meta"),
    docTitle: document.getElementById("doc-title"),
    docDescription: document.getElementById("doc-description"),
    docDateWrap: document.getElementById("doc-date-wrap"),
    docDate: document.getElementById("doc-date"),
    docDot: document.getElementById("doc-dot"),
    docReadingWrap: document.getElementById("doc-reading-wrap"),
    docReading: document.getElementById("doc-reading"),
    docTags: document.getElementById("doc-tags"),
    markdownBody: document.getElementById("markdown-body"),
    docFooter: document.getElementById("doc-footer"),
    docFooterPath: document.getElementById("doc-footer-path"),
    docFooterMeta: document.getElementById("doc-footer-meta"),
    openSidebar: document.getElementById("open-sidebar"),
    backdrop: document.getElementById("backdrop"),
    toast: document.getElementById("toast"),
  };

  const state = {
    tree: null,
    contentDir: CONTENT_DIR,
    fileMap: new Map(),
    dirMap: new Map(),
    open: new Set(),
    openRestored: false,
    activePath: null,
    currentFile: null,
    rawMarkdown: "",
    filter: "",
    requestToken: 0,
    sidebarWidth: 300,
    toastTimer: null,
    filterTimer: null,
    userTheme: false,
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  /* ============================================================
   * 小工具
   * ============================================================ */
  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* 隐私模式下忽略 */
    }
  }

  function iconEl(name, className) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className || "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function decodeSafe(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function formatDate(value) {
    if (!value) return "";
    const text = String(value);
    // 纯日期字符串直接使用，避免时区导致日期偏移
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatShortDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
  }

  function resourceUrl(filePath) {
    return (
      state.contentDir +
      "/" +
      String(filePath)
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")
    );
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* 继续尝试兼容方案 */
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }

  /* ============================================================
   * 主题
   * ============================================================ */
  function applyTheme(theme, persist) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";

    const lightMd = document.getElementById("theme-md-light");
    const darkMd = document.getElementById("theme-md-dark");
    const lightHl = document.getElementById("theme-hl-light");
    const darkHl = document.getElementById("theme-hl-dark");

    if (lightMd) lightMd.disabled = dark;
    if (darkMd) darkMd.disabled = !dark;
    if (lightHl) lightHl.disabled = dark;
    if (darkHl) darkHl.disabled = !dark;

    if (els.themeToggle) {
      const label = dark ? "切换到浅色主题" : "切换到深色主题";
      els.themeToggle.setAttribute("aria-label", label);
      els.themeToggle.title = label;
    }

    if (persist) {
      state.userTheme = true;
      storageSet(STORAGE.theme, dark ? "dark" : "light");
    }
  }

  function initTheme() {
    const stored = storageGet(STORAGE.theme);
    if (stored === "dark" || stored === "light") {
      state.userTheme = true;
      applyTheme(stored, false);
    } else {
      applyTheme(systemDark.matches ? "dark" : "light", false);
    }

    els.themeToggle?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });

    const onSystemChange = (event) => {
      if (!state.userTheme) applyTheme(event.matches ? "dark" : "light", false);
    };

    if (typeof systemDark.addEventListener === "function") {
      systemDark.addEventListener("change", onSystemChange);
    } else if (typeof systemDark.addListener === "function") {
      systemDark.addListener(onSystemChange);
    }
  }

  /* ============================================================
   * 侧边栏宽度 / 移动端抽屉
   * ============================================================ */
  function setSidebarWidth(width) {
    const clamped = Math.max(220, Math.min(560, Math.round(width)));
    state.sidebarWidth = clamped;
    document.documentElement.style.setProperty("--sidebar-w", clamped + "px");
  }

  function initResizer() {
    const saved = Number(storageGet(STORAGE.sidebarWidth));
    if (Number.isFinite(saved) && saved >= 220 && saved <= 560) {
      setSidebarWidth(saved);
    }

    if (!els.resizer) return;

    let startX = 0;
    let startWidth = 0;
    let dragging = false;

    const onMove = (event) => {
      if (!dragging) return;
      const max = Math.max(220, Math.min(560, window.innerWidth - 420));
      setSidebarWidth(Math.max(220, Math.min(max, startWidth + event.clientX - startX)));
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("resizing");
      storageSet(STORAGE.sidebarWidth, String(state.sidebarWidth));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    els.resizer.addEventListener("pointerdown", (event) => {
      if (window.innerWidth <= 900 || event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      startX = event.clientX;
      startWidth = els.sidebar.getBoundingClientRect().width;
      document.body.classList.add("resizing");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });

    els.resizer.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -16 : 16;
      setSidebarWidth(state.sidebarWidth + delta);
      storageSet(STORAGE.sidebarWidth, String(state.sidebarWidth));
    });
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
    els.openSidebar?.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    els.openSidebar?.setAttribute("aria-expanded", "false");
  }

  function initSidebarDrawer() {
    els.openSidebar?.addEventListener("click", () => {
      if (document.body.classList.contains("sidebar-open")) closeSidebar();
      else openSidebar();
    });

    els.backdrop?.addEventListener("click", closeSidebar);

    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const onChange = (event) => {
      if (event.matches) closeSidebar();
    };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onChange);
    }
  }

  /* ============================================================
   * 文件树数据
   * ============================================================ */
  function buildIndex(node) {
    if (!node) return;
    if (node.type === "dir") {
      if (node.path) state.dirMap.set(node.path, node);
      for (const child of node.children || []) buildIndex(child);
    } else {
      state.fileMap.set(node.path, node);
    }
  }

  function pruneOpenFolders() {
    for (const path of [...state.open]) {
      if (!state.dirMap.has(path)) state.open.delete(path);
    }
  }

  function restoreOpenFolders() {
    if (state.openRestored) return;
    state.openRestored = true;
    try {
      const raw = storageGet(STORAGE.openFolders);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return;
      for (const path of saved) {
        if (typeof path === "string" && state.dirMap.has(path)) state.open.add(path);
      }
    } catch {
      /* 忽略损坏的本地数据 */
    }
  }

  function persistOpenFolders() {
    storageSet(STORAGE.openFolders, JSON.stringify([...state.open]));
  }

  function ancestorsOf(filePath) {
    const parts = filePath.split("/");
    parts.pop();
    const result = [];
    let prefix = "";
    for (const part of parts) {
      prefix = prefix ? `${prefix}/${part}` : part;
      result.push(prefix);
    }
    return result;
  }

  function expandAncestors(filePath) {
    let changed = false;
    for (const dir of ancestorsOf(filePath)) {
      if (!state.open.has(dir) && state.dirMap.has(dir)) {
        state.open.add(dir);
        changed = true;
      }
    }
    if (changed) persistOpenFolders();
  }

  function countFiles(node) {
    if (!node) return 0;
    if (node.type === "file") return 1;
    return (node.children || []).reduce((total, child) => total + countFiles(child), 0);
  }

  function countDirs(node) {
    if (!node || node.type === "file") return 0;
    return (node.children || []).reduce(
      (total, child) => total + countDirs(child) + (child.type === "dir" ? 1 : 0),
      0
    );
  }

  function findFirstFile(node) {
    if (!node) return null;
    if (node.type === "file") return node;
    for (const child of node.children || []) {
      const found = findFirstFile(child);
      if (found) return found;
    }
    return null;
  }

  function findRootReadme() {
    const candidates = ["README.md", "readme.md", "Readme.md", "index.md"];
    for (const name of candidates) {
      if (state.fileMap.has(name)) return state.fileMap.get(name);
    }
    for (const [path, node] of state.fileMap) {
      if (path.toLowerCase() === "readme.md") return node;
    }
    return findFirstFile(state.tree?.root);
  }

  function filterNode(node, query) {
    if (!node) return null;

    const pathMatch = node.path.toLowerCase().includes(query);
    if (node.type === "file") {
      return pathMatch || node.name.toLowerCase().includes(query) ? node : null;
    }

    if (pathMatch || node.name.toLowerCase().includes(query)) return node;

    const children = (node.children || []).map((child) => filterNode(child, query)).filter(Boolean);
    return children.length ? Object.assign({}, node, { children }) : null;
  }

  function appendHighlightedName(row, name, query) {
    const span = createEl("span", "tree-name");
    span.title = name;

    if (!query) {
      span.textContent = name;
      row.appendChild(span);
      return;
    }

    const lower = name.toLowerCase();
    const index = lower.indexOf(query);
    if (index === -1) {
      span.textContent = name;
    } else {
      if (index > 0) span.appendChild(document.createTextNode(name.slice(0, index)));
      const mark = document.createElement("mark");
      mark.textContent = name.slice(index, index + query.length);
      span.appendChild(mark);
      if (index + query.length < name.length) {
        span.appendChild(document.createTextNode(name.slice(index + query.length)));
      }
    }
    row.appendChild(span);
  }

  function createTreeItem(node, depth, query) {
    const isDir = node.type === "dir";
    const item = createEl("div", "tree-item " + (isDir ? "is-dir" : "is-file"));
    item.dataset.path = node.path;
    item.setAttribute("role", "none");

    const isOpen = isDir && (!!query || state.open.has(node.path));
    if (isOpen) item.classList.add("open");

    const row = document.createElement("button");
    row.type = "button";
    row.className = "tree-row";
    row.dataset.path = node.path;
    row.dataset.type = node.type;
    row.style.setProperty("--depth", String(depth));
    row.setAttribute("role", "treeitem");
    row.tabIndex = -1;
    row.title = node.path || node.name;

    if (isDir) {
      row.setAttribute("aria-expanded", isOpen ? "true" : "false");
    } else {
      const active = node.path === state.activePath;
      row.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        row.classList.add("active");
        row.setAttribute("aria-current", "page");
      }
    }

    const chevron = createEl("span", "chevron");
    chevron.appendChild(iconEl("chevron"));
    row.appendChild(chevron);

    row.appendChild(iconEl(isDir ? (isOpen ? "folder-open" : "folder") : "markdown", "tree-icon"));
    appendHighlightedName(row, node.name, query);
    item.appendChild(row);

    if (isDir) {
      const childrenBox = createEl("div", "tree-children");
      childrenBox.setAttribute("role", "group");
      for (const child of node.children || []) {
        childrenBox.appendChild(createTreeItem(child, depth + 1, query));
      }
      item.appendChild(childrenBox);
    }

    return item;
  }

  function setFolderOpen(item, open, persist) {
    if (!item || !item.classList.contains("is-dir")) return;
    item.classList.toggle("open", open);
    const row = item.querySelector(":scope > .tree-row");
    row?.setAttribute("aria-expanded", open ? "true" : "false");
    const use = item.querySelector(":scope > .tree-row .tree-icon use");
    use?.setAttribute("href", open ? "#i-folder-open" : "#i-folder");

    const path = item.dataset.path;
    if (open) state.open.add(path);
    else state.open.delete(path);

    if (persist) persistOpenFolders();
  }

  function applyOpenState() {
    for (const item of els.tree.querySelectorAll(".tree-item.is-dir")) {
      setFolderOpen(item, state.open.has(item.dataset.path), false);
    }
    persistOpenFolders();
  }

  function findRow(path) {
    return [...els.tree.querySelectorAll(".tree-row")].find((row) => row.dataset.path === path) || null;
  }

  function setRovingRow(row) {
    for (const item of els.tree.querySelectorAll(".tree-row")) {
      item.tabIndex = item === row ? 0 : -1;
    }
  }

  function focusTreeRow(row) {
    if (!row) return;
    setRovingRow(row);
    row.focus();
  }

  function clearActiveRows() {
    for (const activeRow of els.tree.querySelectorAll(".tree-row.active")) {
      activeRow.classList.remove("active");
      activeRow.removeAttribute("aria-current");
      activeRow.setAttribute("aria-selected", "false");
    }
  }

  function setActiveFile(path) {
    state.activePath = path;
    expandAncestors(path);
    applyOpenState();

    let row = findRow(path);

    // 当前文件被搜索过滤掉时，清空过滤，保证文件可见
    if (!row && state.filter) {
      clearFilter(false);
      row = findRow(path);
    }

    clearActiveRows();

    if (row) {
      row.classList.add("active");
      row.setAttribute("aria-current", "page");
      row.setAttribute("aria-selected", "true");
      setRovingRow(row);
      row.scrollIntoView({ block: "nearest" });
    }
  }

  function updateTreeSummary(matchedFiles) {
    if (!state.tree) return;
    const files = state.tree.stats?.files ?? countFiles(state.tree.root);
    const dirs = state.tree.stats?.dirs ?? countDirs(state.tree.root);

    if (state.filter.trim()) {
      els.treeSummaryText.textContent = `找到 ${matchedFiles || 0} 个文件`;
    } else {
      els.treeSummaryText.textContent = `${files} 篇文章 · ${dirs} 个目录`;
    }

    if (els.treeGenerated) {
      const generated = formatShortDateTime(state.tree.generatedAt);
      els.treeGenerated.textContent = generated ? `更新于 ${generated}` : "内容由 Markdown 驱动";
      els.treeGenerated.title = state.tree.generatedAt
        ? `文件树生成于 ${formatDateTime(state.tree.generatedAt)}`
        : "";
    }
  }

  function renderTree() {
    if (!state.tree) return;

    const query = state.filter.trim().toLowerCase();
    const fragment = document.createDocumentFragment();
    let matchedFiles = 0;

    for (const child of state.tree.root.children || []) {
      const node = query ? filterNode(child, query) : child;
      if (!node) continue;
      if (query) matchedFiles += countFiles(node);
      fragment.appendChild(createTreeItem(node, 0, query));
    }

    els.tree.replaceChildren(fragment);

    if (!els.tree.firstChild) {
      const empty = createEl("div", "tree-empty");
      if (query) {
        empty.appendChild(createEl("div", "", "没有匹配的文件"));
        const hint = createEl("div", "", "试试文件名、文件夹名或路径中的关键词");
        hint.style.marginTop = "4px";
        empty.appendChild(hint);
      } else {
        empty.appendChild(createEl("div", "", "还没有文章"));
        const hint = createEl(
          "div",
          "",
          `在 ${state.contentDir}/ 目录中添加 Markdown 文件后运行 npm run build`
        );
        hint.style.marginTop = "4px";
        hint.style.lineHeight = "1.7";
        empty.appendChild(hint);
      }
      els.tree.appendChild(empty);
    } else {
      const activeRow = state.activePath ? findRow(state.activePath) : null;
      setRovingRow(activeRow || els.tree.querySelector(".tree-row"));
    }

    updateTreeSummary(matchedFiles);
  }

  function showTreeSkeleton() {
    els.tree.innerHTML = `
      <div class="tree-skeleton" aria-hidden="true">
        <span class="sk-row" style="--w: 72%"></span>
        <span class="sk-row" style="--w: 88%; --indent: 14px"></span>
        <span class="sk-row" style="--w: 64%; --indent: 28px"></span>
        <span class="sk-row" style="--w: 78%; --indent: 28px"></span>
        <span class="sk-row" style="--w: 58%; --indent: 14px"></span>
        <span class="sk-row" style="--w: 84%"></span>
        <span class="sk-row" style="--w: 66%; --indent: 14px"></span>
      </div>`;
    els.treeSummaryText.textContent = "正在加载…";
  }

  function renderTreeError(error) {
    els.tree.replaceChildren();
    const box = createEl("div", "tree-empty");
    box.appendChild(createEl("div", "", "文件树加载失败"));
    const detail = createEl("div", "", error?.message || "未知错误");
    detail.style.marginTop = "4px";
    box.appendChild(detail);

    const retry = createEl("button", "state-btn", "重新加载");
    retry.type = "button";
    retry.style.marginTop = "10px";
    retry.style.height = "28px";
    retry.style.fontSize = "12px";
    retry.addEventListener("click", () => reloadTree());
    box.appendChild(retry);
    els.tree.appendChild(box);
    els.treeSummaryText.textContent = "加载失败";
  }

  async function loadTree(options) {
    const opts = options || {};
    if (!state.tree) showTreeSkeleton();

    try {
      const response = await fetch(`${TREE_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (!data || !data.root || !Array.isArray(data.root.children)) {
        throw new Error("tree.json 格式不正确");
      }

      state.tree = data;
      state.contentDir =
        (typeof data.contentDir === "string" && data.contentDir.trim()) || CONTENT_DIR;
      state.contentDir = state.contentDir
        .replace(/\\/g, "/")
        .replace(/^\/+|\/+$/g, "");
      state.fileMap.clear();
      state.dirMap.clear();
      buildIndex(data.root);
      pruneOpenFolders();
      restoreOpenFolders();
      renderTree();

      if (state.activePath) setActiveFile(state.activePath);
      return true;
    } catch (error) {
      console.error("[blog] 加载文件树失败:", error);
      renderTreeError(error);
      if (opts.initial) {
        showError({
          status: 0,
          title: "无法加载文件树",
          message:
            `请求 ${TREE_URL} 失败：${error.message}。` +
            "请先运行 npm run build 生成文件树，并通过 npm start 启动本地服务器（直接双击 index.html 无法使用 fetch）。",
        });
      }
      return false;
    }
  }

  async function reloadTree() {
    const ok = await loadTree();
    if (!ok) {
      showToast("文件树加载失败");
      return;
    }

    if (state.activePath) {
      if (state.fileMap.has(state.activePath)) {
        setActiveFile(state.activePath);
      } else {
        showToast("当前文件已不在文件树中");
        await route();
        return;
      }
    }
    showToast("文件树已更新");
  }

  /* ============================================================
   * 面包屑 / 顶部操作
   * ============================================================ */
  function updateBreadcrumb(path) {
    const fragment = document.createDocumentFragment();

    const home = createEl("button", "crumb", "blog");
    home.type = "button";
    home.title = "返回博客首页";
    home.addEventListener("click", goHome);
    fragment.appendChild(home);

    if (path) {
      const parts = path.split("/");
      parts.forEach((part, index) => {
        fragment.appendChild(createEl("span", "crumb-sep", "/"));

        if (index === parts.length - 1) {
          const current = createEl("span", "crumb current", part);
          current.title = path;
          current.setAttribute("aria-current", "page");
          fragment.appendChild(current);
        } else {
          const dirPath = parts.slice(0, index + 1).join("/");
          const button = createEl("button", "crumb", part);
          button.type = "button";
          button.title = dirPath;
          button.addEventListener("click", () => focusTreeFolder(dirPath));
          fragment.appendChild(button);
        }
      });
    }

    els.breadcrumb.replaceChildren(fragment);
  }

  function updateHeadActions(path) {
    if (!path) {
      els.headActions.hidden = true;
      els.rawLink.removeAttribute("href");
      return;
    }
    els.headActions.hidden = false;
    els.rawLink.href = resourceUrl(path);
    els.copyPath.dataset.path = path;
  }

  function focusTreeFolder(dirPath) {
    closeFilterIfNeeded();
    if (window.innerWidth <= 900) openSidebar();
    expandAncestors(dirPath);
    state.open.add(dirPath);
    applyOpenState();
    const row = findRow(dirPath);
    if (row) {
      row.focus({ preventScroll: true });
      row.scrollIntoView({ block: "center" });
    }
  }

  function closeFilterIfNeeded() {
    if (state.filter) clearFilter(false);
  }

  /* ============================================================
   * 路由
   * ============================================================ */
  function buildHash(path, anchor) {
    let hash = "#/";
    if (path) {
      hash += path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    }
    if (anchor) hash += "#" + encodeURIComponent(anchor);
    return hash;
  }

  function parseHash() {
    const raw = (window.location.hash || "").replace(/^#\/?/, "");
    if (!raw) return { path: "", anchor: "" };

    const hashIndex = raw.indexOf("#");
    const pathPart = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    const anchorPart = hashIndex === -1 ? "" : raw.slice(hashIndex + 1);

    return {
      path: decodeSafe(pathPart).replace(/^\/+|\/+$/g, ""),
      anchor: decodeSafe(anchorPart),
    };
  }

  function navigateTo(path, options) {
    const opts = options || {};
    const hash = buildHash(path, opts.anchor);

    if (window.location.hash === hash) {
      openFile(path, { anchor: opts.anchor });
      return;
    }

    if (opts.replace) {
      window.history.replaceState(null, "", hash);
      openFile(path, { anchor: opts.anchor });
      return;
    }

    window.location.hash = hash;
  }

  async function route() {
    const parsed = parseHash();

    if (!parsed.path) {
      const readme = findRootReadme();
      if (readme) {
        window.history.replaceState(null, "", buildHash(readme.path));
        await openFile(readme.path);
      } else {
        showWelcome();
      }
      return;
    }

    await openFile(parsed.path, { anchor: parsed.anchor });
  }

  function goHome(event) {
    if (event) event.preventDefault();
    const readme = findRootReadme();
    if (readme) {
      navigateTo(readme.path);
    } else {
      window.history.replaceState(null, "", "#/");
      showWelcome();
    }
  }

  /* ============================================================
   * Markdown 加载与渲染
   * ============================================================ */
  function parseFrontMatter(source) {
    const meta = {};
    let content = source;
    const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);

    if (match) {
      content = source.slice(match[0].length);
      for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith("#")) continue;
        const colon = line.indexOf(":");
        if (colon === -1) continue;

        const key = line.slice(0, colon).trim().toLowerCase();
        let value = line.slice(colon + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (key === "tags") {
          meta.tags = parseTags(value);
        } else {
          meta[key] = value;
        }
      }
    }

    return { meta, content };
  }

  function parseTags(value) {
    let text = value.trim();
    if (text.startsWith("[") && text.endsWith("]")) text = text.slice(1, -1);
    return text
      .split(",")
      .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  function estimateReadingTime(content) {
    const cjk = (content.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g) || []).length;
    const words = content
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = cjk / 400 + words / 220;
    return Math.max(1, Math.ceil(minutes));
  }

  function slugify(text) {
    const base = String(text)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return base || "section";
  }

  function addHeadingAnchors() {
    const used = new Set();

    document.querySelectorAll("[id]").forEach((element) => {
      if (!/^H[1-6]$/.test(element.tagName)) used.add(element.id);
    });

    for (const heading of els.markdownBody.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const base = heading.id || slugify(heading.textContent);
      let id = base;
      let counter = 1;
      while (used.has(id)) {
        id = `${base}-${counter}`;
        counter += 1;
      }
      used.add(id);
      heading.id = id;

      const anchor = document.createElement("a");
      anchor.className = "heading-anchor";
      anchor.href = buildHash(state.activePath || "", id);
      anchor.dataset.anchorId = id;
      anchor.title = "跳转到本节";
      anchor.setAttribute("aria-label", "跳转到本节");
      anchor.appendChild(iconEl("link"));
      heading.appendChild(anchor);
    }
  }

  function addCopyButton(code) {
    const pre = code.parentElement;
    if (!pre) return;

    let wrapper = pre.closest(".code-block");
    if (!wrapper) {
      wrapper = createEl("div", "code-block");
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    if (wrapper.querySelector(":scope > .code-copy-btn")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-btn";
    button.title = "复制代码";
    button.setAttribute("aria-label", "复制代码");

    const icon = iconEl("copy");
    const label = createEl("span", "copy-label", "复制");
    button.append(icon, label);

    let resetTimer = null;
    button.addEventListener("click", async () => {
      const ok = await copyText(code.textContent);
      if (!ok) {
        showToast("复制失败，请手动选择代码");
        return;
      }

      button.classList.add("copied");
      const use = button.querySelector("use");
      if (use) use.setAttribute("href", "#i-check");
      label.textContent = "已复制";
      showToast("代码已复制");

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.classList.remove("copied");
        const resetUse = button.querySelector("use");
        if (resetUse) resetUse.setAttribute("href", "#i-copy");
        label.textContent = "复制";
      }, 1800);
    });

    wrapper.appendChild(button);
  }

  function decorateCodeBlocks() {
    for (const code of els.markdownBody.querySelectorAll("pre > code")) {
      const languageClass = [...code.classList].find((name) => name.startsWith("language-"));
      let canHighlight = !!window.hljs;

      if (canHighlight && languageClass) {
        const language = languageClass.slice("language-".length);
        if (!window.hljs.getLanguage(language)) canHighlight = false;
      }

      if (canHighlight) {
        try {
          window.hljs.highlightElement(code);
        } catch (error) {
          console.warn("[blog] 代码高亮失败:", error);
        }
      }

      addCopyButton(code);
    }
  }

  function resolveRelativePath(fromFile, target) {
    const normalizedTarget = decodeSafe(target).replace(/\\/g, "/");
    if (!normalizedTarget) return "";

    let raw;
    if (normalizedTarget.startsWith("/")) {
      raw = normalizedTarget.slice(1);
    } else {
      const base = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : "";
      raw = (base ? base + "/" : "") + normalizedTarget;
    }

    const parts = [];
    for (const part of raw.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") {
        parts.pop();
        continue;
      }
      parts.push(part);
    }
    return parts.join("/");
  }

  function splitHref(href) {
    const hashIndex = href.indexOf("#");
    const beforeHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
    const anchor = hashIndex === -1 ? "" : decodeSafe(href.slice(hashIndex + 1));
    const queryIndex = beforeHash.indexOf("?");
    return {
      path: queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex),
      anchor,
    };
  }

  function isExternalHref(href) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
  }

  function decorateLinks(fileNode) {
    for (const anchor of els.markdownBody.querySelectorAll("a[href]")) {
      if (anchor.classList.contains("heading-anchor")) continue;
      const href = anchor.getAttribute("href") || "";
      if (!href) continue;

      if (href.startsWith("#")) {
        const id = decodeSafe(href.slice(1));
        anchor.classList.add("in-page-link");
        anchor.dataset.anchorId = id;
        anchor.href = buildHash(state.activePath || fileNode.path, id);
        continue;
      }

      if (isExternalHref(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        continue;
      }

      const split = splitHref(href);
      if (!split.path) {
        anchor.classList.add("in-page-link");
        if (split.anchor) anchor.dataset.anchor = split.anchor;
        continue;
      }

      const resolved = resolveRelativePath(fileNode.path, split.path);
      if (!resolved) continue;

      if (/\.(md|markdown)$/i.test(resolved)) {
        anchor.dataset.internal = resolved;
        if (split.anchor) anchor.dataset.anchor = split.anchor;
        anchor.title = state.fileMap.has(resolved) ? resolved : `文件不存在：${resolved}`;
        if (!state.fileMap.has(resolved)) anchor.classList.add("missing-link");
      } else {
        anchor.href = resourceUrl(resolved) + (split.anchor ? "#" + encodeURIComponent(split.anchor) : "");
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
    }

    for (const image of els.markdownBody.querySelectorAll("img[src]")) {
      const src = image.getAttribute("src") || "";
      if (!src || isExternalHref(src) || src.startsWith("data:")) continue;
      const resolved = resolveRelativePath(fileNode.path, src);
      if (resolved) image.src = resourceUrl(resolved);
      image.loading = "lazy";
      image.decoding = "async";
    }
  }

  function scrollToAnchor(anchor, behavior) {
    if (!anchor) return false;
    const target =
      document.getElementById(anchor) || document.getElementsByName(anchor)[0] || null;
    if (!target) return false;

    target.scrollIntoView({
      behavior: behavior || (prefersReducedMotion ? "auto" : "smooth"),
      block: "start",
    });
    return true;
  }

  function renderDocMeta(meta, fileNode, content, firstHeadingText) {
    const title = meta.title || "";
    const description = meta.description || meta.summary || "";
    const dateText = meta.date ? formatDate(meta.date) : "";
    const tags = Array.isArray(meta.tags) ? meta.tags : parseTags(meta.tags || "");
    const reading = estimateReadingTime(content);

    const hideTitle = !title || (!!firstHeadingText && firstHeadingText.trim() === title.trim());

    els.docTitle.textContent = hideTitle ? "" : title;
    els.docTitle.hidden = hideTitle;

    els.docDescription.textContent = description;
    els.docDescription.hidden = !description;

    els.docDate.textContent = dateText;
    if (dateText && /^\d{4}-\d{2}-\d{2}/.test(meta.date)) {
      els.docDate.setAttribute("datetime", meta.date);
    } else {
      els.docDate.removeAttribute("datetime");
    }
    els.docDateWrap.hidden = !dateText;
    els.docDot.hidden = !dateText;

    els.docReading.textContent = `约 ${reading} 分钟`;
    els.docReadingWrap.hidden = false;

    els.docTags.replaceChildren();
    for (const tag of tags) {
      els.docTags.appendChild(createEl("span", "doc-tag", tag));
    }
    els.docTags.hidden = tags.length === 0;

    els.docMeta.hidden = false;

    const displayTitle = title || firstHeadingText || fileNode.name.replace(/\.(md|markdown)$/i, "");
    document.title = `${displayTitle} · blog`;
  }

  function renderFooter(fileNode) {
    els.docFooterPath.textContent = `${state.contentDir}/${fileNode.path}`;
    const parts = [];
    if (Number.isFinite(fileNode.size)) parts.push(formatBytes(fileNode.size));
    if (fileNode.mtime) parts.push(`更新于 ${formatDateTime(fileNode.mtime)}`);
    els.docFooterMeta.textContent = parts.join(" · ");
    els.docFooter.hidden = false;
  }

  function renderMarkdown(raw, fileNode) {
    if (!window.marked) throw new Error("Markdown 解析库（marked）未加载");
    if (!window.DOMPurify) throw new Error("HTML 清洗库（DOMPurify）未加载");

    const parsed = parseFrontMatter(raw);
    state.rawMarkdown = parsed.content;

    const html = window.marked.parse(parsed.content, { gfm: true, breaks: false });
    const clean = window.DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel", "align", "checked", "disabled"],
    });

    els.markdownBody.innerHTML = clean;

    const firstHeading = els.markdownBody.querySelector("h1");
    const firstHeadingText = firstHeading ? firstHeading.textContent.trim() : "";

    addHeadingAnchors();
    decorateCodeBlocks();
    decorateLinks(fileNode);
    renderDocMeta(parsed.meta, fileNode, parsed.content, firstHeadingText);
    renderFooter(fileNode);
  }

  function showLoading() {
    els.docMeta.hidden = true;
    els.docFooter.hidden = true;
    els.markdownBody.innerHTML = `
      <div class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <p>正在加载文章…</p>
      </div>`;
  }

  async function openFile(filePath, options) {
    const opts = options || {};
    const fileNode = state.fileMap.get(filePath);

    if (!fileNode) {
      state.activePath = filePath;
      clearActiveRows();
      const firstRow = els.tree.querySelector(".tree-row");
      if (firstRow) setRovingRow(firstRow);
      updateBreadcrumb(filePath);
      updateHeadActions(filePath);
      showError({
        status: 404,
        title: "文件不存在",
        message: `文件树中没有找到 ${filePath}，请确认路径是否正确，或在左侧重新选择文章。`,
      });
      return;
    }

    if (window.innerWidth <= 900) closeSidebar();

    setActiveFile(fileNode.path);
    updateBreadcrumb(fileNode.path);
    updateHeadActions(fileNode.path);
    showLoading();

    const token = ++state.requestToken;
    const url = resourceUrl(fileNode.path);

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const markdown = await response.text();
      if (token !== state.requestToken) return;

      state.currentFile = fileNode;
      state.activePath = fileNode.path;
      renderMarkdown(markdown, fileNode);

      els.contentScroll.scrollTop = 0;
      if (opts.anchor) {
        window.requestAnimationFrame(() => scrollToAnchor(opts.anchor, "auto"));
        window.setTimeout(() => scrollToAnchor(opts.anchor, "auto"), 120);
      }
    } catch (error) {
      if (token !== state.requestToken) return;
      console.error("[blog] 加载 Markdown 失败:", error);

      const isMissing = error.status === 404;
      showError({
        status: error.status || 0,
        title: isMissing ? "文章不存在" : "无法加载文章",
        message: isMissing
          ? `请求 ${url} 返回 404，文件可能已被移动或删除。`
          : `请求 ${url} 失败：${error.message}。请确认静态服务器正在运行，且文件可以被访问。`,
        retryPath: fileNode.path,
      });
    }
  }

  /* ============================================================
   * 状态页面
   * ============================================================ */
  function buildStatePanel(options) {
    const panel = createEl("div", "state-panel");

    const iconWrap = createEl("div", "state-icon" + (options.danger ? " danger" : ""));
    iconWrap.appendChild(iconEl(options.icon || "alert"));
    panel.appendChild(iconWrap);

    panel.appendChild(createEl("h2", "", options.title || "出错了"));
    if (options.message) panel.appendChild(createEl("p", "", options.message));

    if (options.actions && options.actions.length) {
      const actions = createEl("div", "state-actions");
      for (const action of options.actions) {
        const node = document.createElement(action.href ? "a" : "button");
        node.className = "state-btn" + (action.primary ? " primary" : "");
        node.textContent = action.label;
        if (action.href) {
          node.href = action.href;
          node.target = "_blank";
          node.rel = "noopener";
        } else {
          node.type = "button";
          node.addEventListener("click", action.onClick);
        }
        actions.appendChild(node);
      }
      panel.appendChild(actions);
    }

    return panel;
  }

  function showError(options) {
    state.currentFile = null;
    state.rawMarkdown = "";
    els.docMeta.hidden = true;
    els.docFooter.hidden = true;

    const actions = [];
    const retryPath = options.retryPath || state.activePath;

    if (retryPath && state.fileMap.has(retryPath)) {
      actions.push({
        label: "重新加载",
        primary: true,
        onClick: () => openFile(retryPath),
      });
    }

    actions.push({
      label: "返回首页",
      onClick: goHome,
    });

    if (retryPath) {
      actions.push({
        label: "查看原文",
        href: resourceUrl(retryPath),
        primary: false,
      });
    }

    els.markdownBody.replaceChildren(
      buildStatePanel({
        icon: "alert",
        danger: true,
        title: options.title || "出错了",
        message: options.message || "",
        actions,
      })
    );

    document.title = `${options.title || "出错了"} · blog`;
    els.headActions.hidden = !state.activePath;
  }

  function showWelcome() {
    state.activePath = null;
    state.currentFile = null;
    state.rawMarkdown = "";
    updateBreadcrumb("");
    updateHeadActions("");
    els.docMeta.hidden = true;
    els.docFooter.hidden = true;

    const readme = findRootReadme();
    const actions = [];

    if (readme) {
      actions.push({
        label: "打开博客首页",
        primary: true,
        onClick: () => navigateTo(readme.path),
      });
    }

    const panel = buildStatePanel({
      icon: "layout",
      title: "浏览 Markdown 笔记",
      message: "从左侧文件树选择一篇文章开始阅读，或者从下面的分类进入。",
      actions,
    });

    if (state.tree?.root?.children?.length) {
      const grid = createEl("div", "welcome-grid");
      for (const node of state.tree.root.children) {
        if (node.type !== "dir") continue;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "welcome-card";

        const title = createEl("strong", "", node.name);
        const file = findFirstFile(node);
        const info = createEl("span", "", `${countFiles(node)} 篇文章`);
        card.append(title, info);

        card.addEventListener("click", () => {
          if (file) navigateTo(file.path);
          else focusTreeFolder(node.path);
        });
        grid.appendChild(card);
      }
      panel.appendChild(grid);
    }

    els.markdownBody.replaceChildren(panel);
    document.title = "blog · CGL 技术博客";
  }

  /* ============================================================
   * 交互绑定
   * ============================================================ */
  function toggleFolderItem(item) {
    const open = !item.classList.contains("open");
    setFolderOpen(item, open, true);
  }

  function initTreeInteractions() {
    els.tree.addEventListener("click", (event) => {
      const row = event.target.closest(".tree-row");
      if (!row) return;
      const item = row.parentElement;
      if (!item) return;

      if (row.dataset.type === "dir") {
        toggleFolderItem(item);
      } else {
        navigateTo(row.dataset.path);
      }
      setRovingRow(row);
    });

    els.tree.addEventListener("keydown", (event) => {
      const row = event.target.closest(".tree-row");
      if (!row) return;

      const rows = [...els.tree.querySelectorAll(".tree-row")];
      const index = rows.indexOf(row);
      const item = row.parentElement;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusTreeRow(rows[Math.min(index + 1, rows.length - 1)]);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusTreeRow(rows[Math.max(index - 1, 0)]);
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (row.dataset.type !== "dir" || !item) break;
          if (!item.classList.contains("open")) {
            setFolderOpen(item, true, true);
          } else {
            focusTreeRow(item.querySelector(":scope > .tree-children .tree-row"));
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (row.dataset.type === "dir" && item?.classList.contains("open")) {
            setFolderOpen(item, false, true);
          } else {
            const parentItem = item?.parentElement?.closest(".tree-item");
            focusTreeRow(parentItem?.querySelector(":scope > .tree-row") || null);
          }
          break;
        }
        case "Home": {
          event.preventDefault();
          focusTreeRow(rows[0]);
          break;
        }
        case "End": {
          event.preventDefault();
          focusTreeRow(rows[rows.length - 1]);
          break;
        }
        default:
          break;
      }
    });
  }

  function updateFilter(value) {
    state.filter = value;
    els.clearFilter.hidden = !value;
    window.clearTimeout(state.filterTimer);
    state.filterTimer = window.setTimeout(renderTree, 80);
  }

  function clearFilter(focus) {
    state.filter = "";
    els.treeFilter.value = "";
    els.clearFilter.hidden = true;
    renderTree();
    if (focus !== false) els.treeFilter.focus();
  }

  function initFilter() {
    els.treeFilter.addEventListener("input", (event) => {
      updateFilter(event.target.value);
    });

    els.treeFilter.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        clearFilter(false);
      }
    });

    els.clearFilter.addEventListener("click", () => clearFilter(true));
  }

  function initMarkdownInteractions() {
    els.markdownBody.addEventListener("click", (event) => {
      const anchor = event.target.closest("a");
      if (!anchor) return;

      if (anchor.classList.contains("heading-anchor")) {
        event.preventDefault();
        const id =
          anchor.dataset.anchorId ||
          decodeSafe((anchor.getAttribute("href") || "").replace(/^#/, ""));
        if (state.activePath) {
          window.history.replaceState(null, "", buildHash(state.activePath, id));
        }
        scrollToAnchor(id);
        return;
      }

      if (anchor.dataset.anchorId) {
        event.preventDefault();
        const id = anchor.dataset.anchorId;
        if (state.activePath) {
          window.history.replaceState(null, "", buildHash(state.activePath, id));
        }
        scrollToAnchor(id);
        return;
      }

      if (anchor.dataset.internal) {
        event.preventDefault();
        const target = anchor.dataset.internal;
        if (!state.fileMap.has(target)) {
          showToast(`目标文件不存在：${target}`);
          return;
        }
        navigateTo(target, { anchor: anchor.dataset.anchor || null });
        return;
      }

      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("#")) {
        event.preventDefault();
        scrollToAnchor(decodeSafe(href.slice(1)));
      }
    });
  }

  function bindStaticEvents() {
    els.homeLink?.addEventListener("click", goHome);
    els.aboutLink?.addEventListener("click", goHome);
    els.reloadTree?.addEventListener("click", reloadTree);

    els.copyPath.addEventListener("click", async () => {
      const path = els.copyPath.dataset.path;
      if (!path) return;
      const fullPath = `${state.contentDir}/${path}`;
      const ok = await copyText(fullPath);
      showToast(ok ? `已复制路径：${fullPath}` : "复制失败");
    });

    window.addEventListener("hashchange", () => {
      route();
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "Escape") {
        if (document.body.classList.contains("sidebar-open")) {
          closeSidebar();
          els.openSidebar?.focus();
          return;
        }
        if (isEditable) {
          target.blur();
          return;
        }
      }

      if (event.key === "/" && !isEditable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (window.innerWidth <= 900) openSidebar();
        els.treeFilter.focus();
        els.treeFilter.select();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.innerWidth <= 900) openSidebar();
        els.treeFilter.focus();
        els.treeFilter.select();
      }
    });
  }

  /* ============================================================
   * 启动
   * ============================================================ */
  async function init() {
    initTheme();
    initSidebarDrawer();
    initResizer();
    initTreeInteractions();
    initFilter();
    initMarkdownInteractions();
    bindStaticEvents();

    const ok = await loadTree({ initial: true });
    if (!ok) return;

    await route();
  }

  init();
})();
