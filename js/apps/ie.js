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
          tb = [...el.querySelectorAll(".tbar .tbn")],
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
      tb[0].className = "tbn" + (bd ? " dis" : "");
      tb[0].innerHTML = (bd ? BACKD : BACK) + "<span>Back</span>";
      tb[2].className = "tbn" + (fd ? " dis" : "");
      tb[2].innerHTML = fd ? FWDD : FWD;
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

    tb[0].onclick = () => { if (o.i > 0) { o.i--; show(); } };
    tb[2].onclick = () => { if (o.i < h.length - 1) { o.i++; show(); } };
    tb[3].onclick = () => { try { fr.contentWindow.stop(); } catch (e) {} st.textContent = "Done"; };
    tb[4].onclick = show;
    tb[5].onclick = () => go("about:home");
    tb[8].onclick = () => XP.open && XP.open("mail");
    tb[9].onclick = () => XP.open && XP.open("msg");

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
    if (tb[7]) tb[7].onclick = toggleSidebar;

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
        { label: "Stop", action: () => tb[3].onclick() },
        { label: "Refresh", key: "F5", action: show },
        { label: "Go To", items: [{ label: "Back", disabled: o.i <= 0, action: () => tb[0].onclick() }, { label: "Forward", disabled: o.i >= h.length - 1, action: () => tb[2].onclick() }, { label: "Home Page", action: () => go("about:home") }] }
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

  /* Window body markup */
  const view = k => XP.ui.menubar() + 
    `<div class="tbar">${T("Back",BACKD,"dis")}${T("",'<svg viewBox="0 0 8 8" style="width:8px"><path d="M1 2h6L4 6z" fill="#777"/></svg>',"dis")}${T("",FWDD,"dis")}${T("",STOP,"sm")}${T("",REF,"sm")}${T("",HOME,"sm")}<div class="tsep"></div>${T("Search",`<img src="${IC("search")}">`)}${T("Favorites",`<img src="${IC("fav")}">`)}<div class="tsep"></div>${T("",`<img src="${IC("mail")}">`,"sm")}${T("",`<img src="${IC("msg")}">`,"sm")}</div>` +
    `<div class="abar">Address<div class="inp"><img src="${IC("ie")}"><input value="${k==="msn"?"http://www.msn.com/":"about:home"}" spellcheck="false"></div><span class="go"><i></i>Go</span><span>Links»</span></div>` +
    `<div class="pg">` +
      `<div class="ie-side"><div class="ie-sh"><span>Favorites</span><i title="Close">×</i></div>` +
        `<div class="ie-sb"><button class="xp-btn add">Add...</button><button class="xp-btn org">Organize...</button></div>` +
        `<div class="ie-fl"></div>` +
        `<div class="ie-org"><button class="xp-btn" data-o="rename">Rename</button><button class="xp-btn" data-o="del">Delete</button><button class="xp-btn" data-o="up">Move Up</button><button class="xp-btn" data-o="down">Move Down</button><button class="xp-btn" data-o="done" style="flex-basis:100%">Close</button></div>` +
      `</div>` +
      `<iframe title="Internet Explorer" allow="fullscreen"></iframe>` +
      `<div class="ie-dlg-bg"></div>` +
    `</div>` +
    `<div class="sbar"><img src="${IC("ie")}" width="16" height="16"><span>Done</span><div class="sp"><img src="${IC("ie")}" width="16" height="16"><span>Internet</span></div></div>`;

  const common = {
    multi: true,
    size: { w: 624, h: 405 },
    css: ["css/apps/ie.css"],
    onClose(w) { if (w.ieCleanup) w.ieCleanup(); },
    content: w => view(w.key),
    onOpen(w) {
      const el = w.el, inp = el.querySelector(".abar input");
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