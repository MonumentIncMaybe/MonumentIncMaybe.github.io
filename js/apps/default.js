/* default.js - the FALLBACK app.
 *
 * Any id that has no script of its own (Recycle Bin, My Documents, Control Panel, Run...)
 * opens this: an empty explorer-style window titled from js/config/shell.js.
 * Edit this file to change what every "not built yet" app looks like.
 *
 * To give one of them a real app, create js/apps/<id>.js (copy template.js) and add <id> to
 * XP.settings.apps in js/config/settings.js.
 */
(function () {
  const ui = XP.ui;

  XP.apps.setFallback({
    size: { w: 480, h: 340 },
    multi: false,
    content: w => ui.menubar() + ui.nav() + ui.addr(w.key, XP.shell[w.key] || "") +
      `<div class="mcbody"><div class="list"></div></div><div class="sbar"><span>0 objects</span></div>`
  });
})();
