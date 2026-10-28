/* theme.js - PLACEHOLDER for the theme + wallpaper changer.
 *
 * The API below already works and is remembered between visits; what is missing is a UI for it
 * (a "Display Properties" window). When you build one, it only has to call these functions.
 *
 *   XP.theme.setWallpaper("system/media/bliss.jpg", "cover")   // cover | center | stretch | tile
 *   XP.theme.setWallpaper(null)                                // no picture, just the colour
 *   XP.theme.setBackgroundColor("#3a6ea5")
 *   XP.theme.wallpapers                                        // list shown in a picker: [{name, src}]
 *   XP.theme.register("olive", { name: "Olive Green", css: "css/themes/olive.css" })
 *   XP.theme.set("olive")                                      // loads its CSS, sets <html data-theme>
 *   XP.theme.list()                                            // [{id, name}]
 *
 * See css/themes/README.md for how to write a theme stylesheet.
 */
window.XP = window.XP || {};

(function () {
  const desk = () => XP.$("desktop");
  const MODES = {
    cover:   { size: "cover",     pos: "center", repeat: "no-repeat" },
    center:  { size: "auto",      pos: "center", repeat: "no-repeat" },
    stretch: { size: "100% 100%", pos: "center", repeat: "no-repeat" },
    tile:    { size: "auto",      pos: "0 0",    repeat: "repeat" }
  };

  const theme = XP.theme = {
    current: "luna",
    wallpaper: { src: null, mode: "cover" },

    /* Choices for a wallpaper picker. Add your own images to system/media/ and list them here. */
    wallpapers: [
      { name: "Bliss", src: "system/media/bliss.jpg" }
      // , { name: "My picture", src: "system/media/mine.jpg" }
    ],

    themes: {
      luna: { name: "Windows XP (Luna)", css: null }   // the built-in look: no extra stylesheet
      // olive: { name: "Olive Green", css: "css/themes/olive.css" }
    },

    register(id, def) { theme.themes[id] = def; },
    list() { return Object.keys(theme.themes).map(id => ({ id, name: theme.themes[id].name || id })); },

    set(id, remember = true) {
      const def = theme.themes[id];
      if (!def) { console.warn("[XP] unknown theme: " + id); return false; }
      document.querySelectorAll("link[data-xp-theme]").forEach(l => l.remove());
      if (def.css) {
        const l = document.createElement("link");
        l.rel = "stylesheet"; l.href = def.css; l.dataset.xpTheme = id;
        document.head.appendChild(l);
      }
      document.documentElement.dataset.theme = id;
      theme.current = id;
      if (remember && XP.settings.persist) XP.storage.set("theme", id);
      return true;
    },

    setWallpaper(src, mode, remember = true) {
      const d = desk(), m = MODES[mode || theme.wallpaper.mode] || MODES.cover;
      theme.wallpaper = { src: src || null, mode: mode || theme.wallpaper.mode };
      d.style.backgroundImage = src ? 'url("' + src + '")' : "none";
      d.style.backgroundSize = m.size;
      d.style.backgroundPosition = m.pos;
      d.style.backgroundRepeat = m.repeat;
      if (remember && XP.settings.persist) XP.storage.set("wallpaper", theme.wallpaper);
    },

    setBackgroundColor(color, remember = true) {
      desk().style.backgroundColor = color;
      if (remember && XP.settings.persist) XP.storage.set("bgcolor", color);
    },

    /* Called once at startup (js/core/shell.js): the settings, overridden by whatever the visitor saved.
       Nothing is written back here, so editing js/config/settings.js still works until they pick their own. */
    init() {
      const S = XP.settings, saved = S.persist;
      const wp = (saved && XP.storage.get("wallpaper")) || S.wallpaper;
      theme.setWallpaper(wp.src, wp.mode, false);
      const color = saved && XP.storage.get("bgcolor");
      if (color) desk().style.backgroundColor = color;
      /* A saved theme that no longer exists (or was only registered at runtime) falls back to the settings theme, then Luna. */
      const pick = [saved && XP.storage.get("theme"), S.theme].find(id => id && theme.themes[id]) || "luna";
      if (pick !== "luna") theme.set(pick, false); else document.documentElement.dataset.theme = "luna";
    }
  };
})();
