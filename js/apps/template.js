/* template.js - a working example app that shows how every part of the apps API is used.
 *
 * TO TRY IT:   in js/config/settings.js add  "template"  to the `apps` list. A "Template App"
 *              icon appears on the desktop; open it and click the buttons.
 * TO MAKE YOUR OWN:  copy this file to js/apps/myapp.js, change the id, and add "myapp" to `apps`.
 *
 * An app file just calls XP.apps.register({...}) once. It runs after the core is loaded, so
 * XP.* is available. Wrap it in (function(){ ... })() to keep your variables private.
 */
(function () {

  /* ---------- 1. register the app ---------- */
  XP.apps.register({
    id: "template",                    // unique. XP.open("template") opens it.
    title: "Template App",             // window title (or a function: opts => "title")
    icon: "app",                       // icon name from system/icons/ (app.png), or a full URL
    label: "Template App",             // text under the desktop icon (default: the title)
    desktop: true,                     // show it on the desktop
    multi: false,                      // false: opening again just focuses the existing window
    size: { w: 460, h: 380 },          // starting size in px
    css: ["css/apps/template.css"],    // optional stylesheet, loaded when the app registers

    /* ---------- 2. content: what goes inside the window ----------
       Return an HTML string OR a DOM node. `win` is the window object, `opts` is whatever was
       passed to XP.open("template", opts).                                                   */
    content(win, opts) {
      const root = document.createElement("div");
      root.className = "tpl";
      root.innerHTML = `
        <h3>Hello, ${XP.esc(XP.settings.userName)}!</h3>
        <p>This window is the template app. Each button below calls part of the API.</p>

        <div class="tpl-row">
          <button class="xp-btn" data-do="another">New window</button>
          <button class="xp-btn" data-do="title">Set title</button>
          <button class="xp-btn" data-do="open-docs">Open My Documents</button>
        </div>
        <div class="tpl-row">
          <button class="xp-btn" data-do="wallpaper">Next wallpaper</button>
          <button class="xp-btn" data-do="color">Random desktop colour</button>
          <button class="xp-btn" data-do="theme">Next theme</button>
        </div>
        <div class="tpl-row">
          <button class="xp-btn" data-do="count">Saved clicks: <span class="n">0</span></button>
          <button class="xp-btn" data-do="list">List windows + apps</button>
        </div>
        <pre class="tpl-out"></pre>`;
      return root;
    },

    /* ---------- 3. onOpen: the window is in the page, wire up events ---------- */
    onOpen(win, opts) {
      const out = win.body.querySelector(".tpl-out");
      const say = t => { out.textContent = t; };
      const n = win.body.querySelector(".n");

      /* XP.storage: tiny persistent key/value store (localStorage under the hood). */
      n.textContent = XP.storage.get("template.clicks", 0);

      let i = 0, j = 0;
      const actions = {
        /* XP.open(id, opts): open any app. `multi:false` apps are re-focused instead. */
        another()  { XP.open("template"); say("XP.open('template') -> this app isn't `multi`, so it just refocused."); },
        "open-docs"() { XP.open("docs"); say("XP.open('docs') -> 'docs' has no script, so it opened the default app."); },

        /* The window object: win.setTitle / win.close / win.minimize / win.toggleMax ... */
        title()    { win.setTitle("Template App " + (++i)); say("win.setTitle(...) changes the title bar and the taskbar button."); },

        /* XP.theme: wallpaper + theme changer (js/core/theme.js). */
        wallpaper() {
          const list = XP.theme.wallpapers;
          const w = list[++j % list.length];
          XP.theme.setWallpaper(w.src, "cover");
          say("XP.theme.setWallpaper('" + w.src + "', 'cover')\n(add more images to XP.theme.wallpapers to cycle)");
        },
        color()    { const c = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"); XP.theme.setBackgroundColor(c); say("XP.theme.setBackgroundColor('" + c + "')"); },
        theme()    {
          const t = XP.theme.list(), cur = t.findIndex(x => x.id === XP.theme.current);
          const next = t[(cur + 1) % t.length];
          XP.theme.set(next.id);
          say("XP.theme.set('" + next.id + "')   [" + t.length + " theme(s) registered]");
        },

        count()    { const v = XP.storage.get("template.clicks", 0) + 1; XP.storage.set("template.clicks", v); n.textContent = v; say("XP.storage.set('template.clicks', " + v + ")  - survives a page reload."); },

        /* XP.windows / XP.apps: look at what's running and what's registered. */
        list()     {
          say("Open windows:\n  " + XP.windows.list().map(w => w.title).join("\n  ") +
              "\n\nRegistered apps:\n  " + XP.apps.list().map(a => a.id).join(", "));
        }
      };

      win.body.addEventListener("click", e => {
        const b = e.target.closest("[data-do]");
        if (b) actions[b.dataset.do]();
      });
    },

    /* ---------- 4. onClose: clean up timers / listeners you created ---------- */
    onClose(win) {
      /* nothing to clean up here */
    }
  });


  /* ---------- 5. optional: react to the shell finishing startup ---------- */
  document.addEventListener("xp:ready", () => {
    /* e.g. XP.open("template");   // open your app automatically at startup */
  });

})();
