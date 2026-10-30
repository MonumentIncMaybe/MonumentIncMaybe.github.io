/* contextmenu.js - XP.contextMenu: right-click menus in the classic Windows XP style.
 *
 *   XP.contextMenu.show(x, y, items)        open a menu at a screen position
 *   XP.contextMenu.showAt(el, items)        open a menu under an element (menu-bar drop-downs)
 *   XP.contextMenu.hide()
 *   XP.contextMenu.register(selector, fn)   fn(target, event) -> items[] (or null to fall through).
 *                                           The closest matching ancestor of the click wins.
 *
 * An item is one of:
 *   { label, action, icon, bold, checked, disabled, key, items }   items = a submenu (array)
 *   "-"                                                            a separator line
 *   `icon` is an icon name (see js/core/icons.js) or a URL.
 *
 * Apps can add menus for their own elements, e.g. from onOpen:
 *   XP.contextMenu.register(".my-row", (el, e) => [ { label: "Open", bold: true, action: () => ... } ]);
 * or skip the registry and call XP.contextMenu.show() from their own "contextmenu" listener
 * (call e.preventDefault() + e.stopPropagation() there so the desktop menu doesn't also open).
 *
 * Text fields (<input>, <textarea>) get an XP-style Cut / Copy / Paste menu.
 * Cross-origin <iframe> content (websites inside Internet Explorer) keeps the browser's own menu:
 * the page can't see events inside another site.
 */
window.XP = window.XP || {};

(function () {
  const IC = XP.icons.get;
  let root = null, stack = [];
  const providers = [];

  /* ---------- rendering ---------- */
  function build(items, depth) {
    const m = document.createElement("div");
    m.className = "xpm";
    m.dataset.depth = depth;
    items.forEach(it => {
      if (it === "-" || it.sep) { m.insertAdjacentHTML("beforeend", '<div class="msep"></div>'); return; }
      const d = document.createElement("div");
      d.className = "mi" + (it.disabled ? " dis" : "") + (it.bold ? " bold" : "") + (it.checked ? " chk" : "") + (it.items ? " sub" : "");
      if (it.icon) { const i = document.createElement("img"); i.alt = ""; i.src = IC(it.icon); d.appendChild(i); }
      const t = document.createElement("span"); t.textContent = it.label; d.appendChild(t);
      if (it.key) { const k = document.createElement("span"); k.className = "key"; k.textContent = it.key; d.appendChild(k); }
      d._item = it;
      m.appendChild(d);
    });
    return m;
  }

  function closeFrom(depth) {
    while (stack.length > depth) stack.pop().remove();
  }

  function place(m, x, y, flipX) {
    m.style.left = "0px"; m.style.top = "0px";
    document.body.appendChild(m);
    const r = m.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    let px = x, py = y;
    if (px + r.width > W) px = flipX != null ? Math.max(0, flipX - r.width) : Math.max(0, W - r.width - 1);
    if (py + r.height > H) py = Math.max(0, H - r.height - 1);
    m.style.left = px + "px"; m.style.top = py + "px";
  }

  function openSub(row, depth) {
    closeFrom(depth + 1);
    const it = row._item;
    if (!it || !it.items || it.disabled) return;
    const sub = build(it.items, depth + 1), r = row.getBoundingClientRect();
    place(sub, r.right - 3, r.top - 3, r.left + 3);
    stack.push(sub);
    wire(sub);
  }

  function wire(m) {
    const depth = +m.dataset.depth;
    m.addEventListener("pointerover", e => {
      const row = e.target.closest(".mi");
      if (!row || !m.contains(row)) return;
      m.querySelectorAll(".mi.on").forEach(x => x.classList.remove("on"));
      row.classList.add("on");
      if (row._item && row._item.items) openSub(row, depth); else closeFrom(depth + 1);
    });
    m.addEventListener("click", e => {
      e.stopPropagation();
      const row = e.target.closest(".mi");
      if (!row || !row._item || row._item.disabled || row._item.items) return;
      const fn = row._item.action;
      hide();
      if (fn) setTimeout(fn, 0);
    });
    m.addEventListener("contextmenu", e => e.preventDefault());
  }

  function show(x, y, items) {
    hide();
    items = (items || []).filter(Boolean);
    if (!items.length) return;
    root = build(items, 0);
    place(root, x, y);
    stack = [root];
    wire(root);
  }

  function hide() { closeFrom(0); root = null; }

  function showAt(el, items) {
    const r = el.getBoundingClientRect();
    show(r.left, r.bottom, items);
  }

  /* ---------- provider registry ---------- */
  function register(selector, fn) { providers.push({ selector, fn }); }

  function itemsFor(target, e) {
    let best = null, bestEl = null;
    for (const p of providers) {
      const el = target.closest(p.selector);
      if (!el) continue;
      /* the deepest (closest to the click) match wins; ties go to the later registration */
      if (!bestEl || bestEl.contains(el)) { best = p; bestEl = el; }
    }
    if (!best) return null;
    return best.fn(bestEl, e);
  }

  document.addEventListener("contextmenu", e => {
    if (e.defaultPrevented) return;                     // an app already handled it
    if (e.target.closest(".xpm")) { e.preventDefault(); return; }
    const items = itemsFor(e.target, e);
    if (items === undefined || items === null) {
      /* nothing registered here: keep the browser menu inside page content (iframes, inputs) */
      if (e.target.closest("iframe")) return;
      e.preventDefault(); hide(); return;
    }
    e.preventDefault();
    show(e.clientX, e.clientY, items);
  });

  /* Close on any outside click, Escape, window blur (clicking into an iframe), resize. */
  document.addEventListener("pointerdown", e => { if (root && !e.target.closest(".xpm")) hide(); }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") hide(); });
  addEventListener("blur", hide);
  addEventListener("resize", hide);

  XP.contextMenu = { show, showAt, hide, register, isOpen: () => !!root };

  /* ---------- default menus ---------- */
  const winOf = el => XP.windows.find(w => w.el === el.closest(".win"));
  const winOfTask = el => XP.windows.find(w => w.btn === el);

  const showDesktop = () => {
    const open = XP.windows.list().filter(w => !w.min);
    open.forEach(w => XP.windows.minimize(w));
  };

  /* Window system menu (right-click the title bar or the window icon; also used by the task buttons). */
  const sysMenu = w => [
    { label: "Restore", icon: null, disabled: !(w.max || w.min), action: () => { if (w.min) { XP.windows.restore(w); XP.windows.focus(w); } else w.toggleMax(); } },
    { label: "Move", disabled: true },
    { label: "Size", disabled: true },
    { label: "Minimize", disabled: w.min, action: () => w.minimize() },
    { label: "Maximize", disabled: w.max, action: () => { if (w.min) XP.windows.restore(w); if (!w.max) w.toggleMax(); } },
    "-",
    { label: "Close", bold: true, key: "Alt+F4", action: () => w.close() }
  ];

  register("#desktop", (el, e) => {
    if (e.target !== el) return null;                   // clicks on windows/icons are handled by their own entries
    return [
      { label: "Arrange Icons By", items: [{ label: "Name", disabled: true }, { label: "Type", disabled: true }, { label: "Size", disabled: true }] },
      { label: "Refresh", action: () => document.querySelectorAll(".dicon.sel").forEach(x => x.classList.remove("sel")) },
      "-",
      { label: "Paste", disabled: true },
      { label: "Paste Shortcut", disabled: true },
      "-",
      { label: "New", items: [{ label: "Folder", disabled: true }, { label: "Shortcut", disabled: true }, "-", { label: "Text Document", disabled: true }] },
      "-",
      { label: "Properties", action: () => XP.open("display") }
    ];
  });

  register(".dicon", el => {
    const id = el.dataset.app;
    return [
      { label: "Open", bold: true, action: () => XP.open(id) },
      { label: "Explore", disabled: true },
      "-",
      { label: "Create Shortcut", disabled: true },
      { label: "Delete", disabled: true },
      { label: "Rename", disabled: true },
      "-",
      { label: "Properties", disabled: true }
    ];
  });

  register(".win .capdrag, .win .wi", el => { const w = winOf(el); return w ? sysMenu(w) : null; });

  register("#tasks .task", el => {
    const w = winOfTask(el);
    return w ? sysMenu(w) : null;
  });

  register("#tasks, #taskbar", () => [
    { label: "Toolbars", disabled: true },
    "-",
    { label: "Show the Desktop", action: showDesktop },
    { label: "Task Manager...", disabled: true },
    "-",
    { label: "Lock the Taskbar", checked: true, disabled: true },
    { label: "Properties", disabled: true }
  ]);

  register("#tray", () => [
    { label: "Adjust Date/Time", disabled: true },
    { label: "Customize Notifications", disabled: true }
  ]);

  register("#menu .it[data-app]", el => [
    { label: "Open", bold: true, action: () => { XP.startMenu.hide(); XP.open(el.dataset.app); } },
    { label: "Explore", disabled: true },
    "-",
    { label: "Properties", disabled: true }
  ]);

  /* Text fields: XP-style edit menu. */
  register("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]), textarea", el => {
    const ro = el.readOnly || el.disabled, sel = el.selectionStart !== el.selectionEnd;
    const exec = c => { el.focus(); document.execCommand(c); };
    return [
      { label: "Undo", disabled: ro, action: () => exec("undo") },
      "-",
      { label: "Cut", disabled: ro || !sel, action: () => exec("cut") },
      { label: "Copy", disabled: !sel, action: () => exec("copy") },
      { label: "Paste", disabled: ro, action: () => { el.focus(); (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject()).then(t => document.execCommand("insertText", false, t)).catch(() => document.execCommand("paste")); } },
      { label: "Delete", disabled: ro || !sel, action: () => exec("delete") },
      "-",
      { label: "Select All", action: () => { el.focus(); el.select(); } }
    ];
  });

  XP.contextMenu.sysMenu = sysMenu;
  XP.contextMenu.showDesktop = showDesktop;
})();
