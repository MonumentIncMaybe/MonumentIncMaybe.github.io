/* apps.js - the app registry (the "apps API").
 *
 * An app is a JS file in js/apps/ that calls XP.apps.register({...}). Every field except `id`
 * is optional. See js/apps/_template.js for a working, commented example.
 *
 *   id         unique id; also what XP.open("id") / Start menu / desktop use
 *   title      window title: string, or (opts) => string          (default: XP.shell[id] or the id)
 *   icon       icon name or URL for title bar, taskbar, desktop   (default: the id)
 *   label      desktop icon text                                  (default: the title)
 *   size       { w, h } or (opts) => ({ w, h })                   (default 480 x 340)
 *   multi      true = every open() makes a new window             (default false: re-focus the old one)
 *   desktop    true = show an icon on the desktop
 *   css        [ "css/apps/x.css" ] loaded when the app registers
 *   content(win, opts)   returns the window body: an HTML string or a DOM node
 *   onOpen(win, opts)    window exists and is in the page: wire up events here
 *   onClose(win)         window is being closed: clean up timers etc.
 *
 * `win` is the window object: win.el (whole window), win.body (client area), win.title, win.key,
 * win.setTitle(t), win.close(), win.minimize(), win.restore(), win.toggleMax(), win.focus().
 *
 * An id with no registered app opens the FALLBACK app (js/apps/default.js).
 */
window.XP = window.XP || {};

(function () {
  const defs = {}, auto = {};
  let fallback = { size: { w: 480, h: 340 }, multi: false, content: () => "" };

  XP.apps = {
    register(def) {
      if (!def || !def.id) throw new Error("XP.apps.register: an app needs an id");
      if (defs[def.id]) console.warn("[XP] app '" + def.id + "' registered twice; the later one wins");
      defs[def.id] = def;
      (def.css || []).forEach(XP.loadCss);
      return def;
    },

    has: id => !!defs[id],
    get: id => defs[id] || null,
    list: () => Object.keys(defs).map(id => defs[id]),

    /* The app to use when an id has no script of its own. */
    setFallback(def) { fallback = def; },

    /* The registered app, or an auto-made default for that id. Never returns null. */
    resolve(id) {
      if (defs[id]) return defs[id];
      if (!auto[id]) {
        auto[id] = Object.assign({}, fallback, {
          id, icon: id, isDefault: true,
          title: (XP.shell && XP.shell[id]) || id
        });
      }
      return auto[id];
    },

    /* Display name for a desktop icon. */
    labelOf(id) {
      const a = XP.apps.resolve(id);
      return a.label || (typeof a.title === "string" ? a.title : "") || id;
    }
  };
})();
