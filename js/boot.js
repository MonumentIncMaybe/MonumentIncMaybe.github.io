/* boot.js - the only script index.html loads.
 *
 * Load order:  js/config/*  ->  js/core/*  ->  js/apps/default.js  ->  js/apps/<name>.js for every
 * name in XP.settings.apps  ->  XP.start().
 *
 * A file that fails to load (404) is skipped with a console warning, so a missing app script never
 * breaks the desktop: that app id simply falls back to the default app (js/apps/default.js).
 */
(function () {
  const XP = (window.XP = window.XP || {});

  XP.loadScript = src => new Promise(done => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => done(true);
    s.onerror = () => { console.warn("[XP] could not load " + src); done(false); };
    document.head.appendChild(s);
  });

  XP.loadCss = href => {
    if ([...document.styleSheets].some(x => x.href && x.href.endsWith(href))) return;
    if (document.querySelector('link[data-xp-css="' + href + '"]')) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.dataset.xpCss = href;
    document.head.appendChild(l);
  };

  const seq = list => list.reduce((p, s) => p.then(() => XP.loadScript(s)), Promise.resolve());

  const CONFIG = [
    "js/config/settings.js",   // user name, wallpaper, theme, which apps to load, desktop icon order
    "js/config/shell.js",      // window titles for built-in ids that have no app script
    "js/config/startmenu.js"   // Start menu entries
  ];

  const CORE = [
    "js/core/util.js",         // XP.$, XP.esc, XP.storage
    "js/core/icons.js",        // XP.icons
    "js/core/filestore.js",    // XP.files  (IndexedDB store for uploaded backgrounds)
    "js/core/theme.js",        // XP.theme  (wallpaper + theme changer API)
    "js/core/apps.js",         // XP.apps   (app registry / API)
    "js/core/explorer.js",     // XP.ui     (shared menu bar / toolbar / address bar markup)
    "js/core/windows.js",      // XP.windows, XP.open
    "js/core/startmenu.js",    // XP.startMenu
    "js/core/desktop.js",      // XP.desktop (icons, selection, clock, start button)
    "js/core/shell.js",        // XP.start()
    "js/core/contextmenu.js",  // XP.contextMenu (right-click menus)
    "js/core/login.js"         // XP.login (Welcome screen, Log Off, Turn Off)
  ];

  seq(CONFIG)
    .then(() => seq(CORE))
    .then(() => XP.loadScript("js/apps/default.js"))
    .then(() => seq((XP.settings.apps || []).map(n => "js/apps/" + n + ".js")))
    .then(() => XP.start());
})();
