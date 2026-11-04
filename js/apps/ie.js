/* ie.js - Internet Explorer (ids "ie" and "msn").
 * A browser-looking window around an <iframe>. Type an address and press Enter / Go.
 * Favorites: menu-bar Favorites menu, the Favorites sidebar (toolbar button), Add / Organize / Rename.
 * Proxy + favorites-database notes are in the comment blocks below.
 */
(function () {
  const IC = XP.icons.get;
  const { BACK, FWD, BACKD, FWDD, STOP, REF, HOME, tb: T } = XP.ui;

  /* ------------------------------------------------------------------------------------------
   * INTERNET EXPLORER PROXY - PLACEHOLDER (read this before wiring a backend)
   *
   * Right now every page is an <iframe src="https://..."> straight to the site. Many sites (google,
   * msn, youtube...) send X-Frame-Options / CSP frame-ancestors headers and refuse to load there,
   * and the page can't see inside the frame (no real page title, no real history).
   *
   * To fix that, put a small server in the middle and set PROXY below, e.g.
   *     const PROXY = "https://your-server.example/proxy?url=";
   * The server should:
   *   1. fetch the requested URL itself (GET only, block private/localhost addresses - SSRF!)
   *   2. strip X-Frame-Options and Content-Security-Policy frame headers from the response
   *   3. rewrite links / <base href> so clicks stay on the proxy, and add <title> to a JSON header
   *      or postMessage so the title bar and "Add to Favorites" can use the real page title
   *   4. optionally cache results and enforce an allow/deny list
   * Then viaProxy() is the only function that needs to change; ieFrame() already calls it for
   * every navigation (Back/Forward/Refresh/Go).  Leave PROXY empty to keep the direct <iframe>.
   * ------------------------------------------------------------------------------------------ */
  const PROXY = "";                                   // <- e.g. "https://your-server.example/proxy?url="
  const viaProxy = u => PROXY ? PROXY + encodeURIComponent(u) : u;

  /* ---------------------------------------------------------------------------------------------
   * FAVORITES - saved in this browser (XP.storage key "ie.favorites" -> localStorage "xp.ie.favorites").
   * Shape: [{ title, url }]. To sync favorites across devices, replace load()/save() with calls to
   * your database/API (same placeholder backend as the proxy above) - nothing else needs to change.
   * ------------------------------------------------------------------------------------------- */
  const DEFAULT_FAVS = [
    { title: "Windows XP - Wikipedia", url: "https://en.wikipedia.org/wiki/Windows_XP" },
    { title: "Internet Archive", url: "https://archive.org/" },
    { title: "Example Domain", url: "https://example.com/" }
  ];

  const Favs = {
    load() {
      let l = XP.storage.get("ie.favorites", null);
      if (!l) {                                         // migrate the old key used by the first version of this file
        try { l = JSON.parse(localStorage.getItem("xp_ie_favorites")); } catch (e) {}
      }
      return Array.isArray(l) ? l : DEFAULT_FAVS.map(x => Object.assign({}, x));
    },
    save(l) { XP.storage.set("ie.favorites", l); document.dispatchEvent(new CustomEvent("xp:ie-favorites")); },
    add(title, url) {
      const l = Favs.load(), ex = l.find(f => f.url === url);
      if (ex) ex.title = title; else l.push({ title, url });
      Favs.save(l);
    }
  };

  /* The "Welcome to the Web" start page shown for about:home. */
  const STARTPG=`<!doctype html><meta charset=utf-8><style>body{margin:0;font:12px Tahoma,Verdana,sans-serif;background:#fff;color:#000}.h{background:linear-gradient(#3b6fd0,#1d4aa8);color:#fff;padding:14px 20px;font-size:22px;font-weight:bold}.h small{display:block;font-size:11px;font-weight:normal;opacity:.85}.c{padding:14px 20px}a{color:#0033cc;cursor:pointer;display:block;margin:4px 0}h4{margin:10px 0 4px;color:#1d4aa8}p{color:#666}</style><div class=h>Welcome to the Web<small>Internet Explorer start page</small></div><div class=c><h4>Try a page</h4><a data-u="https://en.wikipedia.org/wiki/Windows_XP">Windows XP - Wikipedia</a><a data-u="https://example.com/">example.com</a><a data-u="https://archive.org/">Internet Archive</a><p>Type an address above and press Enter. Some sites (msn.com, google.com...) refuse to be shown inside a frame.</p></div><script>document.onclick=e=>{const u=e.target.dataset&&e.target.dataset.u;if(u)parent.postMessage({go:u},'*')}<\/script>`;

  /* Back / Forward / history / loading status for one IE window. */
  function ieFrame(w, el, inp) {
    const fr = el.querySelector(".pg iframe"),
          K = k => el.querySelector('.tbar [data-k="' + k + '"]'),
          bBack = K("back"), bFwd = K("fwd"), bStop = K("stop"), bRef = K("refresh"), bHome = K("home"),
          bFav = K("favorites"), bMail = K("mail"), bMsg = K("messenger"),
          st = el.querySelector(".sbar span"),
          h = [],
          o = { i: -1 };

    const fix = u => {
      u = u.trim();
      if (!u) return "";
      if (/^about:|^https?:\/\//i.test(u)) return u.replace(/^http:/i, "https:");
      return "https://" + u;
    };

    const updateTitle = (titleText) => {
      if (typeof w.setTitle === "function") {
        w.setTitle(titleText);
      } else {
        w.title = titleText;
        const wt = el.querySelector(".wt");
        if (wt) wt.textContent = titleText;
        if (w.btn) {
          const sp = w.btn.querySelector("span");
          if (sp) sp.textContent = titleText;
        }
      }
    };

    const show = () => {
      const u = h[o.i];
      if (u === "about:home") {
        fr.srcdoc = STARTPG;
        fr.removeAttribute("src");
        inp.value = "about:home";
      } else {
        fr.removeAttribute("srcdoc");
        fr.src = viaProxy(u);
      }
      st.textContent = "Opening page...";
      const bd = o.i <= 0, fd = o.i >= h.length - 1;
      bBack.className = "tbn" + (bd ? " dis" : "");
      bBack.innerHTML = (bd ? BACKD : BACK) + "<span>Back</span>";
      bFwd.className = "tbn" + (fd ? " dis" : "");
      bFwd.innerHTML = fd ? FWDD : FWD;
    };

    const go = (u, add = !0) => {
      u = fix(u);
      if (!u) return;
      if (add) {
        h.splice(o.i + 1);
        h.push(u);
        o.i = h.length - 1;
      }
      if (u !== "about:home") {
        inp.value = u.replace(/^https:\/\//, "http://");
        const pageTitle = u.replace(/^https?:\/\//, "").replace(/\/$/, "") + " - Microsoft Internet Explorer";
        updateTitle(pageTitle);
      } else {
        inp.value = "about:home";
        updateTitle("Welcome to MSN.com - Microsoft Internet Explorer");
      }
      show();
    };

    fr.onload = () => st.textContent = "Done";
    w.nav = u => go(u);

    addEventListener("message", e => {
      if (e.source === fr.contentWindow && e.data && e.data.go) go(e.data.go);
    });

    bBack.onclick = () => { if (o.i > 0) { o.i--; show(); } };
    bFwd.onclick = () => { if (o.i < h.length - 1) { o.i++; show(); } };
    bStop.onclick = () => { try { fr.contentWindow.stop(); } catch (e) {} st.textContent = "Done"; };
    bRef.onclick = show;
    bHome.onclick = () => go("about:home");
    bMail.onclick = () => XP.open && XP.open("mail");
    bMsg.onclick = () => XP.open && XP.open("msg");

    /* ---------- Favorites: sidebar, menu, add / rename dialog, organize ---------- */
    const pg = el.querySelector(".pg"),
          fl = el.querySelector(".ie-fl"),
          dlgBg = el.querySelector(".ie-dlg-bg");
    let selIdx = -1;

    const pageUrl = () => { const u = h[o.i]; return u && u !== "about:home" ? u : ""; };
    const pageTitle = () => (w.title || "").replace(/ - Microsoft Internet Explorer$/, "") || pageUrl();

    const renderFavs = () => {
      const list = Favs.load();
      fl.innerHTML = "";
      if (!list.length) { fl.innerHTML = '<div class="ie-none">No favorites yet. Click Add... to save this page.</div>'; return; }
      list.forEach((f, i) => {
        const d = document.createElement("div");
        d.className = "ie-fi" + (i === selIdx ? " sel" : "");
        d.title = f.title + "\n" + f.url;
        d.innerHTML = `<img src="${IC("star")}" alt=""><span></span>`;
        d.lastChild.textContent = f.title;
        d.onclick = () => { if (pg.classList.contains("organize")) { selIdx = i; renderFavs(); } else go(f.url); };
        d.addEventListener("contextmenu", e => {
          e.preventDefault(); e.stopPropagation();
          XP.contextMenu.show(e.clientX, e.clientY, [
            { label: "Open", bold: true, action: () => go(f.url) },
            { label: "Open in New Window", action: () => { const nw = XP.open(w.key); if (nw && nw.nav) nw.nav(f.url); } },
            "-",
            { label: "Rename...", action: () => askName("Rename Favorite", f.title, f.url, n => { const l = Favs.load(); if (l[i]) { l[i].title = n; Favs.save(l); } }) },
            { label: "Delete", action: () => { const l = Favs.load(); l.splice(i, 1); Favs.save(l); } }
          ]);
        });
        fl.appendChild(d);
      });
    };

    const askName = (heading, value, url, done) => {
      dlgBg.innerHTML = `<div class="ie-dlg"><div class="t"></div><div class="b"><p></p><label>Name:</label><input type="text" spellcheck="false"><div class="u"></div><div class="f"><button class="xp-btn ok">OK</button><button class="xp-btn cancel">Cancel</button></div></div></div>`;
      dlgBg.querySelector(".t").textContent = heading;
      dlgBg.querySelector("p").textContent = heading === "Add Favorite" ? "Internet Explorer will add this page to your Favorites list." : "Type a new name for this favorite.";
      const inp2 = dlgBg.querySelector("input"); inp2.value = value;
      dlgBg.querySelector(".u").textContent = url;
      dlgBg.classList.add("show");
      const close = () => dlgBg.classList.remove("show");
      const ok = () => { const n = inp2.value.trim(); if (n) done(n); close(); };
      dlgBg.querySelector(".ok").onclick = ok;
      dlgBg.querySelector(".cancel").onclick = close;
      inp2.onkeydown = e => { if (e.key === "Enter") ok(); else if (e.key === "Escape") close(); };
      setTimeout(() => { inp2.focus(); inp2.select(); }, 0);
    };

    const addCurrent = () => {
      const u = pageUrl();
      if (!u) { askName("Add Favorite", "", "", () => {}); dlgBg.classList.remove("show"); st.textContent = "Open a web page first, then add it to Favorites."; return; }
      askName("Add Favorite", pageTitle(), u, n => Favs.add(n, u));
    };

    const setSidebar = on => { pg.classList.toggle("side", on); if (!on) pg.classList.remove("organize"); if (on) renderFavs(); };
    const toggleSidebar = () => setSidebar(!pg.classList.contains("side"));
    const organize = () => { setSidebar(true); pg.classList.add("organize"); selIdx = -1; renderFavs(); };

    const orgAct = {
      rename() { const l = Favs.load(), f = l[selIdx]; if (f) askName("Rename Favorite", f.title, f.url, n => { f.title = n; Favs.save(l); }); },
      up() { const l = Favs.load(); if (selIdx > 0) { [l[selIdx - 1], l[selIdx]] = [l[selIdx], l[selIdx - 1]]; selIdx--; Favs.save(l); } },
      down() { const l = Favs.load(); if (selIdx >= 0 && selIdx < l.length - 1) { [l[selIdx + 1], l[selIdx]] = [l[selIdx], l[selIdx + 1]]; selIdx++; Favs.save(l); } },
      del() { const l = Favs.load(); if (selIdx >= 0) { l.splice(selIdx, 1); selIdx = -1; Favs.save(l); } },
      done() { pg.classList.remove("organize"); selIdx = -1; renderFavs(); }
    };
    el.querySelectorAll(".ie-org [data-o]").forEach(b => b.onclick = () => orgAct[b.dataset.o]());
    el.querySelector(".ie-sb .add").onclick = addCurrent;
    el.querySelector(".ie-sb .org").onclick = organize;
    el.querySelector(".ie-sh i").onclick = () => setSidebar(false);

    const onFavs = () => renderFavs();
    document.addEventListener("xp:ie-favorites", onFavs);
    w.ieCleanup = () => document.removeEventListener("xp:ie-favorites", onFavs);

    /* toolbar "Favorites" button toggles the sidebar */
    if (bFav) bFav.onclick = toggleSidebar;

    /* menu bar: File / Edit / View / Favorites / Tools / Help */
    const favMenu = () => {
      const l = Favs.load();
      return [
        { label: "Add to Favorites...", icon: "star-16", action: addCurrent },
        { label: "Organize Favorites...", action: organize },
        "-"
      ].concat(l.length ? l.slice(0, 24).map(f => ({ label: f.title.length > 40 ? f.title.slice(0, 38) + "…" : f.title, icon: "star-16", action: () => go(f.url) })) : [{ label: "(Empty)", disabled: true }]);
    };
    const menus = {
      File: () => [
        { label: "New Window", action: () => XP.open(w.key) },
        { label: "Open...", key: "Ctrl+O", action: () => { inp.focus(); inp.select(); } },
        "-",
        { label: "Close", action: () => w.close() }
      ],
      Edit: () => [{ label: "Cut", disabled: true }, { label: "Copy", disabled: true }, { label: "Paste", disabled: true }, "-", { label: "Select All", disabled: true }],
      View: () => [
        { label: "Explorer Bar", items: [{ label: "Favorites", key: "Ctrl+I", checked: pg.classList.contains("side"), action: toggleSidebar }, { label: "Search", disabled: true }] },
        "-",
        { label: "Stop", action: () => bStop.onclick() },
        { label: "Refresh", key: "F5", action: show },
        { label: "Go To", items: [{ label: "Back", disabled: o.i <= 0, action: () => bBack.onclick() }, { label: "Forward", disabled: o.i >= h.length - 1, action: () => bFwd.onclick() }, { label: "Home Page", action: () => go("about:home") }] }
      ],
      Favorites: favMenu,
      Tools: () => [{ label: "Internet Options...", disabled: true }],
      Help: () => [{ label: "About Internet Explorer", disabled: true }]
    };
    el.querySelectorAll(".mb span").forEach(sp => sp.addEventListener("click", e => {
      e.stopPropagation();
      const f = menus[sp.textContent.trim()];
      if (f) XP.contextMenu.showAt(sp, f());
    }));

    /* right-click the page area (outside the frame), address bar star etc. is handled globally */
    renderFavs();

    /* Initial Load */
    const startUrl = k => k === "msn" ? "http://www.msn.com/" : "about:home";
    go(startUrl(w.key));
  }

  /* Extra toolbar icons (the shared set in XP.ui has no Print / Edit / History). */
  const PRINT = XP.ui.svg(0, '<rect x="6" y="2.5" width="10" height="6.5" fill="#fff" stroke="#7a7a7a"/><rect x="2.5" y="8.5" width="17" height="8" rx="1.5" fill="#c9ccd2" stroke="#5f626a"/><rect x="6" y="13" width="10" height="6.5" fill="#fff" stroke="#7a7a7a"/><path d="M8 15.5h6M8 17.5h6" stroke="#9aa0aa"/>'),
        EDIT  = XP.ui.svg(0, '<rect x="3.5" y="2.5" width="12" height="16" fill="#fff" stroke="#6b6e76"/><path d="M6 6.5h7M6 9h7M6 11.5h4" stroke="#8fa3c8"/><path d="M10 17l7-9 2.5 2-7 9-3 .8z" fill="#f2c94c" stroke="#8a6d1f"/>'),
        HIST  = XP.ui.svg(0, '<circle cx="12" cy="10" r="7.5" fill="#fff" stroke="#3b6fd0" stroke-width="1.5"/><path d="M12 5.5V10l3.2 2" stroke="#222" stroke-width="1.5" fill="none"/><path d="M1.5 13l3.2-3.8v2.4H8v2.8H4.7v2.4z" fill="#3aa83a"/>'),
        DD    = '<svg viewBox="0 0 8 8"><path d="M1 2.5h6L4 6z" fill="#000"/></svg>';

  /* One toolbar button; data-k lets the code above find it without counting positions. */
  const tbk = (k, t, i, c = "") => `<div class="tbn ${c}" data-k="${k}">${i}${t ? `<span>${t}</span>` : ""}</div>`;
  const dd = (k, c = "") => `<div class="tbn dd ${c}" data-k="${k}">${DD}</div>`;

  /* Internet Explorer 6 look (scoped to .ie-win so My Computer / other explorer windows are untouched). */
  const IE_CSS = `
.ie-win .mb { height: 22px; padding: 0 2px; border-bottom: 1px solid #fff; box-shadow: 0 1px 0 #d6d2c2; }
.ie-win .mb span { padding: 3px 6px; }
.ie-win .mb img { height: 20px; margin: 1px 2px 0 auto; }

.ie-win .tbar { height: 38px; padding: 0 2px 0 3px; gap: 0; background: var(--xp-window-bg, #ece9d8); border-bottom: 1px solid #aca899; box-shadow: 0 1px 0 #fff; }
.ie-win .tbar::before, .ie-win .abar::before { content: ""; flex: none; width: 3px; height: 28px; margin: 0 5px 0 2px; border-left: 1px solid #fff; border-right: 1px solid #aca899; }
.ie-win .tbn { height: 34px; padding: 2px 4px; gap: 4px; border-radius: 3px; }
.ie-win .tbn:hover { border-color: #aca899; background: linear-gradient(#fff, #e8e5d6); }
.ie-win .tbn:active { background: #dedbc9; }
.ie-win .tbn.dis:hover { border-color: transparent; background: none; }
.ie-win .tbn.dd { width: 11px; padding: 0; margin-left: -3px; justify-content: center; }
.ie-win .tbn.dd svg { width: 7px; height: 7px; }
.ie-win .tbn.dd.dis svg path { fill: #a3a395; }
.ie-win .tsep { height: 30px; margin: 0 4px; border-left: 1px solid #aca899; border-right: 1px solid #fff; background: none; width: 0; }

.ie-win .abar { height: 28px; padding: 0 4px 0 3px; gap: 4px; color: #6d6d65; border-bottom: 1px solid #aca899; box-shadow: 0 1px 0 #fff; }
.ie-win .abar::before { height: 22px; margin-right: 2px; }
.ie-win .abar .inp { height: 21px; padding: 0 0 0 3px; border: 1px solid #7f9db9; }
.ie-win .abar .inp .ddb { flex: none; width: 17px; height: 17px; margin-right: 1px; border-radius: 2px; background: linear-gradient(#cfdcf8, #a9c0f0 55%, #bcd0f6); border: 1px solid #8aa5d8; position: relative; }
.ie-win .abar .inp .ddb::after { content: ""; position: absolute; left: 4px; top: 6px; border: 3.5px solid transparent; border-top: 4px solid #4d6185; }
.ie-win .go { gap: 4px; padding: 0 3px; }
.ie-win .go i { width: 18px; height: 18px; border-radius: 3px; border: 1px solid #1d7d18; background: linear-gradient(#7edc6e, #2f9f26 60%, #46b83b); }
.ie-win .go i::after { left: 5px; top: 4px; }
.ie-win .lk { color: #000; padding: 0 2px 0 8px; position: relative; white-space: nowrap; }
.ie-win .lk::before { content: ""; position: absolute; left: 0; top: -6px; height: 22px; border-left: 1px solid #fff; border-right: 1px solid #aca899; width: 2px; }

.ie-win .pg { border: 1px solid; border-color: #716f64 #fff #fff #716f64; }
.ie-win .pg iframe { background: #fff; }

.ie-win .sbar { height: 22px; padding: 1px 0 1px 2px; gap: 2px; border-top: 1px solid #aca899; }
.ie-win .sbar > img { margin: 0 3px 0 2px; }
.ie-win .sbar > span { flex: 1; height: 18px; line-height: 18px; padding: 0 4px; box-shadow: inset 1px 1px #aca899, inset -1px -1px #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ie-win .sbar .sp { width: 130px; height: 18px; margin-left: 0; padding-left: 6px; gap: 4px; border-left: 0; box-shadow: inset 1px 1px #aca899, inset -1px -1px #fff; }
`;
  const addIeCss = () => {
    if (document.getElementById("ie-skin")) return;
    const st = document.createElement("style");
    st.id = "ie-skin"; st.textContent = IE_CSS;
    document.head.appendChild(st);
  };

  /* Window body markup */
  const view = k => XP.ui.menubar().replace("tour.png", "xpflag.png") +
    `<div class="tbar">${tbk("back", "Back", BACKD, "dis")}${dd("backdd", "dis")}${tbk("fwd", "", FWDD, "dis")}${dd("fwddd", "dis")}<div class="tsep"></div>${tbk("stop", "", STOP, "sm")}${tbk("refresh", "", REF, "sm")}${tbk("home", "", HOME, "sm")}<div class="tsep"></div>${tbk("search", "Search", `<img src="${IC("search")}">`)}${tbk("favorites", "Favorites", `<img src="${IC("fav")}">`)}${tbk("media", "", `<img src="${IC("wmp-real")}">`, "sm")}${tbk("history", "", HIST, "sm")}<div class="tsep"></div>${tbk("mail", "", `<img src="${IC("mail")}">`, "sm")}${dd("maildd")}${tbk("print", "", PRINT, "sm")}${tbk("edit", "", EDIT, "sm")}${tbk("messenger", "", `<img src="${IC("msg")}">`, "sm")}</div>` +
    `<div class="abar">Address<div class="inp"><img src="${IC("ie")}"><input value="${k==="msn"?"http://www.msn.com/":"about:home"}" spellcheck="false"><i class="ddb"></i></div><span class="go"><i></i>Go</span><span class="lk">Links&nbsp;&raquo;</span></div>` +
    `<div class="pg">` +
      `<div class="ie-side"><div class="ie-sh"><span>Favorites</span><i title="Close">×</i></div>` +
        `<div class="ie-sb"><button class="xp-btn add">Add...</button><button class="xp-btn org">Organize...</button></div>` +
        `<div class="ie-fl"></div>` +
        `<div class="ie-org"><button class="xp-btn" data-o="rename">Rename</button><button class="xp-btn" data-o="del">Delete</button><button class="xp-btn" data-o="up">Move Up</button><button class="xp-btn" data-o="down">Move Down</button><button class="xp-btn" data-o="done" style="flex-basis:100%">Close</button></div>` +
      `</div>` +
      `<iframe title="Internet Explorer" allow="fullscreen"></iframe>` +
      `<div class="ie-dlg-bg"></div>` +
    `</div>` +
    `<div class="sbar"><img src="${IC("ie")}" width="16" height="16"><span>Done</span><div class="sp"><img src="${IC("globe-16")}" width="16" height="16"><span>Internet</span></div></div>`;

  const common = {
    multi: true,
    size: { w: 624, h: 405 },
    css: ["css/apps/ie.css"],
    onClose(w) { if (w.ieCleanup) w.ieCleanup(); },
    content: w => view(w.key),
    onOpen(w) {
      const el = w.el, inp = el.querySelector(".abar input");
      el.classList.add("ie-win");
      addIeCss();
      const go = () => {
        const v = inp.value.trim();
        if (!v) return;
        w.nav && w.nav(v);
      };
      inp.onkeydown = e => { if (e.key === "Enter") go(); };
      const goBtn = el.querySelector(".go");
      if (goBtn) goBtn.onclick = go;
      ieFrame(w, el, inp);
    }
  };

  XP.apps.register(Object.assign({ id: "ie",  title: "Welcome to MSN.com - Microsoft Internet Explorer", icon: "ie" },  common));
  XP.apps.register(Object.assign({ id: "msn", title: "MSN.com - Microsoft Internet Explorer",             icon: "msn" }, common));
})();
