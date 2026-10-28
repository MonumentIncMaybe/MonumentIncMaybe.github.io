/* icons.js - icon lookup.
 *
 *   XP.icons.get("ie")                 -> "system/icons/ie.png"
 *   XP.icons.get("https://x/y.png")    -> returned as-is (anything with "/" or ":" is treated as a URL)
 *   XP.icons.set("myapp", url)         -> override / add an icon name at runtime
 *   XP.icons.fallbacks.myapp = url     -> used by XP.icons.bind() if the icon fails to load
 *
 * Icon files live in system/icons/<name>.png (32x32). Drop a new PNG in there and use its name.
 * Anything under system/icons/ that fails to load is replaced by system/icons/app.png.
 */
window.XP = window.XP || {};

(function () {
  const icons = XP.icons = {
    dir: "system/icons/",
    ext: ".png",
    generic: "system/icons/app.png",
    map: {},         // name -> url overrides
    fallbacks: {},   // name -> url to use if the real one fails to load

    /* Names shipped in system/icons/ (only used to preload them). */
    names: ["cd", "cp", "docs", "fav", "folder", "hdd", "help", "ie", "mail", "mc", "msg", "msn",
            "music", "pics", "rb", "run", "search", "spa", "tour", "wmp", "xfer"],

    get(name) {
      if (!name) return "";
      if (icons.map[name]) return icons.map[name];
      if (/[\/:]/.test(name)) return name;
      return icons.dir + name + icons.ext;
    },

    set(name, url) { icons.map[name] = url; },

    /* Set an <img>'s src to an icon, with the per-name fallback if it fails. */
    bind(img, name) {
      img.onerror = () => {
        img.onerror = null;
        const fb = icons.fallbacks[name];
        if (fb) { icons.map[name] = fb; img.src = fb; }
      };
      img.src = icons.get(name);
    },

    preload(list) { (list || icons.names).forEach(n => { new Image().src = icons.get(n); }); }
  };

  /* Any icon from system/icons/ that 404s becomes the generic app icon. */
  document.addEventListener("error", e => {
    const t = e.target;
    if (!t || t.tagName !== "IMG" || t.dataset.fb) return;
    const src = t.getAttribute("src") || "";
    if (src.indexOf(icons.dir) === 0 && src !== icons.generic) { t.dataset.fb = 1; t.src = icons.generic; }
  }, true);
})();
