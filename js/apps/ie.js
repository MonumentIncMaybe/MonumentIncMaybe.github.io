/* ie.js - Internet Explorer (ids "ie" and "msn").
 * A browser-looking window around an <iframe>. Type an address and press Enter / Go.
 */
(function () {
  const IC = XP.icons.get;
  const { BACK, FWD, BACKD, FWDD, STOP, REF, HOME, tb: T } = XP.ui;

  /* Default bookmarks */
  const defaultBookmarks = [
    { title: "Windows XP - Wikipedia", url: "https://en.wikipedia.org/wiki/Windows_XP" },
    { title: "Internet Archive", url: "https://archive.org/" },
    { title: "Example Domain", url: "https://example.com/" }
  ];

  /* Persistent Bookmarks Storage */
  function getBookmarks() {
    try {
      const saved = localStorage.getItem("xp_ie_favorites");
      return saved ? JSON.parse(saved) : defaultBookmarks;
    } catch (e) {
      return defaultBookmarks;
    }
  }

  function saveBookmarks(list) {
    try {
      localStorage.setItem("xp_ie_favorites", JSON.stringify(list));
    } catch (e) {}
  }

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
        fr.src = u;
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

    /* Favorites Sidebar Setup */
    const favBtn = tb[7];
    const favSidebar = el.querySelector(".fav-sidebar");
    const favList = el.querySelector(".fav-list");
    const addFavBtn = el.querySelector(".add-fav-btn");

    const renderBookmarks = () => {
      const bookmarks = getBookmarks();
      favList.innerHTML = "";
      bookmarks.forEach((bm, index) => {
        const item = document.createElement("div");
        item.className = "fav-item";
        item.style.cssText = "padding:4px 6px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px;user-select:none;";
        item.title = bm.title + " (" + bm.url + ")";
        item.innerHTML = `<img src="${IC("fav")}" width="16" height="16" style="flex-shrink:0;"><span style="overflow:hidden;text-overflow:ellipsis;flex:1;">${XP.esc ? XP.esc(bm.title) : bm.title}</span><span class="del-bm" style="color:#888;font-weight:bold;padding:0 2px;" title="Delete">×</span>`;
        
        item.onclick = (evt) => {
          if (evt.target.classList.contains("del-bm")) {
            evt.stopPropagation();
            const list = getBookmarks();
            list.splice(index, 1);
            saveBookmarks(list);
            renderBookmarks();
            return;
          }
          go(bm.url);
        };
        favList.appendChild(item);
      });
    };

    const toggleFavorites = () => {
      const isVisible = favSidebar.style.display !== "none";
      favSidebar.style.display = isVisible ? "none" : "flex";
      if (!isVisible) renderBookmarks();
    };

    if (favBtn) favBtn.onclick = toggleFavorites;

    /* Handle Menubar 'Favorites' click */
    const mbSpans = el.querySelectorAll(".mb span");
    mbSpans.forEach(span => {
      if (span.textContent.trim().toLowerCase() === "favorites") {
        span.style.cursor = "pointer";
        span.onclick = toggleFavorites;
      }
    });

    addFavBtn.onclick = () => {
      let currentUrl = h[o.i] || inp.value.trim();
      if (!currentUrl || currentUrl === "about:home") return;
      
      let title = w.title ? w.title.replace(" - Microsoft Internet Explorer", "") : currentUrl;
      const list = getBookmarks();
      if (!list.some(b => b.url === currentUrl)) {
        list.push({ title: title || currentUrl, url: currentUrl });
        saveBookmarks(list);
        renderBookmarks();
      }
    };

    renderBookmarks();

    /* Initial Load */
    const startUrl = k => k === "msn" ? "http://www.msn.com/" : "about:home";
    go(startUrl(w.key));
  }

  /* Window body markup */
  const view = k => XP.ui.menubar() + 
    `<div class="tbar">${T("Back",BACKD,"dis")}${T("",'<svg viewBox="0 0 8 8" style="width:8px"><path d="M1 2h6L4 6z" fill="#777"/></svg>',"dis")}${T("",FWDD,"dis")}${T("",STOP,"sm")}${T("",REF,"sm")}${T("",HOME,"sm")}<div class="tsep"></div>${T("Search",`<img src="${IC("search")}">`)}${T("Favorites",`<img src="${IC("fav")}">`)}<div class="tsep"></div>${T("",`<img src="${IC("mail")}">`,"sm")}${T("",`<img src="${IC("msg")}">`,"sm")}</div>` +
    `<div class="abar">Address<div class="inp"><img src="${IC("ie")}"><input value="${k==="msn"?"http://www.msn.com/":"about:home"}" spellcheck="false"></div><span class="go"><i></i>Go</span><span>Links»</span></div>` +
    `<div class="pg" style="display:flex;position:relative;height:calc(100% - 73px);overflow:hidden;">` +
      `<div class="fav-sidebar" style="display:none;width:180px;min-width:180px;height:100%;border-right:1px solid #716f64;background:#f1efe2;flex-direction:column;font:11px Tahoma,sans-serif;box-sizing:border-box;z-index:10;position:relative;">` +
        `<div style="padding:4px;border-bottom:1px solid #acd;background:#e3e3db;">` +
          `<button class="add-fav-btn" style="width:100%;font:11px Tahoma;cursor:pointer;padding:2px 4px;">Add to Favorites...</button>` +
        `</div>` +
        `<div class="fav-list" style="overflow-y:auto;flex:1;padding:4px;"></div>` +
      `</div>` +
      `<iframe title="Internet Explorer" allow="fullscreen" style="flex:1;width:100%;height:100%;border:none;position:relative;z-index:1;"></iframe>` +
    `</div>` +
    `<div class="sbar"><img src="${IC("ie")}" width="16" height="16"><span>Done</span><div class="sp"><img src="${IC("ie")}" width="16" height="16"><span>Internet</span></div></div>`;

  const common = {
    multi: true,
    size: { w: 624, h: 405 },
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
