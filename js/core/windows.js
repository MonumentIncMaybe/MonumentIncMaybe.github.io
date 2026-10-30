/* windows.js - the window manager.
 *
 *   XP.open(id, opts)        open an app by id (re-focuses the existing window unless the app is `multi`)
 *   XP.windows.list()        all open windows
 *   XP.windows.find(fn)      first window matching fn(win)
 *   XP.windows.focus(win) / restore(win) / minimize(win) / close(win) / toggleMax(win)
 *   XP.windows.active()      the focused window
 *
 * What an app puts inside the window comes from its definition (js/core/apps.js);
 * this file only draws the frame, the taskbar button, and handles dragging / resizing / min / max.
 */
window.XP = window.XP || {};

(function () {
  const $ = XP.$, desk = $("desktop"), tasks = $("tasks");
  let zTop = 100, wins = [], activeW = null, cas = 0, uid = 0;

  function open(k, o) {
    o = o || {};
    const app = XP.apps.resolve(k);

    /* Single-instance apps: bring the existing window forward instead of opening a second one. */
    if (!app.multi) {
      const ex = wins.find(w => w.key === k);
      if (ex) { if (ex.min) restore(ex); focus(ex); return ex; }
    }

    const size = (typeof app.size === "function" ? app.size(o) : app.size) || { w: 480, h: 340 };
    const title = typeof app.title === "function" ? app.title(o) : (o.title || app.title || k);
    const n = cas++ % 8;   // cascade: each new window is offset a little from the last
    const w = { id: ++uid, key: k, app, min: false, max: false, x: 70 + n * 26, y: 24 + n * 26, w: size.w, h: size.h, title };
    const el = document.createElement("div");
    el.className = "win";
    const icon = XP.icons.get(app.icon || k);

    el.innerHTML = `<div class="cap"></div><img class="wi" src="${icon}" alt=""><div class="wt"></div><div class="capdrag"></div><div class="cb mn"></div><div class="cb mx"></div><div class="cb x"></div><div class="fl"></div><div class="fr"></div><div class="fb"></div><div class="cl"></div>`
      + ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map(d => `<div class="rz" data-d="${d}"></div>`).join("");
    el.querySelector(".wt").textContent = w.title;
    w.el = el;
    w.body = el.querySelector(".cl");

    /* The app's content: an HTML string or a DOM node. */
    const content = app.content ? app.content(w, o) : "";
    if (typeof content === "string") w.body.innerHTML = content;
    else if (content) w.body.appendChild(content);

    desk.appendChild(el);
    place(w);

    const b = document.createElement("div");
    b.className = "task";
    b.innerHTML = `<img src="${icon}" width="16" height="16" alt=""><span></span>`;
    b.querySelector("span").textContent = w.title;
    w.btn = b;
    tasks.appendChild(b);

    /* Helpers apps can call on their window. */
    w.setTitle = t => { w.title = t; el.querySelector(".wt").textContent = t; b.querySelector("span").textContent = t; };
    w.focus = () => focus(w);
    w.close = () => close(w);
    w.minimize = () => minimize(w);
    w.restore = () => restore(w);
    w.toggleMax = () => toggleMax(w);

    b.onclick = () => { if (w.min) { restore(w); focus(w) } else if (activeW === w) minimize(w); else focus(w) };
    el.addEventListener("pointerdown", () => focus(w), true);
    el.querySelector(".cb.x").onclick = e => { e.stopPropagation(); close(w) };
    el.querySelector(".cb.mn").onclick = e => { e.stopPropagation(); minimize(w) };
    el.querySelector(".cb.mx").onclick = e => { e.stopPropagation(); toggleMax(w) };
    const cd = el.querySelector(".capdrag");
    cd.ondblclick = () => toggleMax(w);
    cd.addEventListener("pointerdown", e => dragStart(w, e));
    el.querySelectorAll(".rz").forEach(r => r.addEventListener("pointerdown", e => resizeStart(w, e, r.dataset.d)));

    if (app.onOpen) app.onOpen(w, o);

    wins.push(w);
    focus(w);
    return w;
  }

  /* ---- frame behaviour: place / focus / minimize / restore / close / maximize / drag / resize ---- */
  function place(w){const s=w.el.style;if(w.max){s.left=s.top="0";s.width=s.height="100%"}else{s.left=w.x+"px";s.top=w.y+"px";s.width=w.w+"px";s.height=w.h+"px"}}

  function focus(w){if(w.min)return;wins.forEach(o=>{o.el.classList.toggle("inactive",o!==w);o.btn.classList.toggle("active",o===w)});w.el.style.zIndex=++zTop;activeW=w}

  function topmost(){return wins.filter(o=>!o.min).sort((a,b)=>b.el.style.zIndex-a.el.style.zIndex)[0]}

  function minimize(w){w.min=!0;w.el.style.display="none";w.btn.classList.remove("active");if(activeW===w){activeW=null;const t=topmost();if(t)focus(t)}}

  function restore(w){w.min=!1;w.el.style.display=""}

  function close(w){if(w.app&&w.app.onClose)w.app.onClose(w);w.el.remove();w.btn.remove();wins=wins.filter(o=>o!==w);if(activeW===w){activeW=null;const t=topmost();if(t)focus(t)}}

  function toggleMax(w){w.max=!w.max;w.el.classList.toggle("max",w.max);place(w);focus(w)}

  function dragStart(w,e){if(e.button!==0||w.max)return;const sx=e.clientX,sy=e.clientY,ox=w.x,oy=w.y,t=e.currentTarget;t.setPointerCapture(e.pointerId);const mv=ev=>{w.x=Math.max(-w.w+90,Math.min(desk.clientWidth-90,ox+ev.clientX-sx));w.y=Math.max(0,Math.min(desk.clientHeight-29,oy+ev.clientY-sy));place(w)},up=()=>{t.removeEventListener("pointermove",mv);t.removeEventListener("pointerup",up)};t.addEventListener("pointermove",mv);t.addEventListener("pointerup",up)}

  function resizeStart(w,e,d){if(e.button!==0||w.max)return;e.preventDefault();const sx=e.clientX,sy=e.clientY,o={x:w.x,y:w.y,w:w.w,h:w.h},t=e.currentTarget;t.setPointerCapture(e.pointerId);const MW=220,MH=120,mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;let{x,y,w:ww,h}=o;if(d.includes("e"))ww=Math.max(MW,o.w+dx);if(d.includes("s"))h=Math.max(MH,o.h+dy);if(d.includes("w")){ww=Math.max(MW,o.w-dx);x=o.x+o.w-ww}if(d.includes("n")){h=Math.max(MH,o.h-dy);y=o.y+o.h-h}w.x=x;w.y=Math.max(0,y);w.w=ww;w.h=h;place(w)},up=()=>{t.removeEventListener("pointermove",mv);t.removeEventListener("pointerup",up)};t.addEventListener("pointermove",mv);t.addEventListener("pointerup",up)}

  XP.windows = {
    list: () => wins.slice(),
    find: fn => wins.find(fn),
    active: () => activeW,
    open, focus, restore, minimize, close, toggleMax
  };
  XP.open = open;
})();
