/* shell.js - XP.start(): runs once, after config, core and all app scripts have loaded. */
window.XP = window.XP || {};

XP.start = function () {
  XP.theme.init();        // wallpaper + theme
  XP.icons.preload();     // warm the cache so windows don't pop in without icons
  XP.startMenu.build();
  XP.desktop.build();     // needs the apps registered, so it runs after they loaded
  XP.desktop.init();
  document.dispatchEvent(new CustomEvent("xp:ready"));   // apps can listen: document.addEventListener("xp:ready", ...)
};
