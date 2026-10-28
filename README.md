# Windows XP in the browser - modular version

Same desktop as before, just split into folders. Open `index.html` (double-click works; a local web
server is fine too). The Deltarune/website app and its icon need an internet connection.

```
index.html              the page skeleton only (~30 lines)
css/
  base.css              page reset, font, desktop surface, desktop icons
  taskbar.css           start button, task buttons, tray
  startmenu.css         start menu panel
  window.css            window frame (caption, borders, buttons, resize handles)
  explorer.css          shared app chrome (menu bar, toolbar, address bar, status bar) + .xp-btn
  theme.css             PLACEHOLDER: colour variables you can override
  themes/               PLACEHOLDER: one stylesheet per theme (see its README)
  apps/                 per-app stylesheets (messenger.css, template.css)
js/
  boot.js               the only script index.html loads; loads config -> core -> apps
  config/
    settings.js         user name, wallpaper, theme, desktop icon order, WHICH APPS TO LOAD
    shell.js            window titles for ids that have no app script
    startmenu.js        Start menu entries
  core/                 the "OS": util, icons, theme, apps (registry/API), explorer (shared UI),
                        windows (window manager), startmenu, desktop, shell
  apps/
    default.js          FALLBACK app: used by every id that has no script of its own
    mycomputer.js  ie.js  messenger.js  custom.js        the existing apps
    _template.js        working demo of the whole apps API (not loaded until you add it)
system/
  icons/                one PNG per icon (cd.png, ie.png, mc.png ... app.png = generic)
  ui/                   taskbar / window frame / start menu images (were base64 in index.html)
  media/ msn/ fonts/    unchanged
XP assets/              unchanged (original source files, not used by the page)
```

## Make an app
1. Copy `js/apps/_template.js` to `js/apps/myapp.js`, change `id`, `title`, `content`.
2. Add `"myapp"` to `apps` in `js/config/settings.js`.
3. Done. `desktop: true` puts it on the desktop; to put it in the Start menu add a line to
   `js/config/startmenu.js`.

An id with no script (Recycle Bin, My Documents, Control Panel, ...) - or a script that fails to
load - opens the default app (`js/apps/default.js`) instead. To make one real, give it a script.

Apps API (`js/core/apps.js` has the full list): `XP.apps.register({ id, title, icon, label, size,
multi, desktop, css, content(win, opts), onOpen(win, opts), onClose(win) })`, `XP.open(id, opts)`,
`XP.windows.*`, `XP.icons.*`, `XP.storage.get/set`, `XP.theme.*`.

## Icons
Drop a 32x32 PNG into `system/icons/` and use its file name (without `.png`) as `icon`. Anything that
fails to load becomes `app.png`. The website app uses the site's favicon (edit `SITES` in `js/apps/custom.js`).

## Wallpaper and themes (placeholders with a working API)
`XP.theme.setWallpaper(src, "cover" | "center" | "stretch" | "tile")`, `XP.theme.setBackgroundColor(c)`,
`XP.theme.set(id)`. Choices are remembered in localStorage. There is no picker window yet - it only has
to call these. The default wallpaper is `settings.wallpaper` in `js/config/settings.js`.

## Where things went (old single index.html -> now)
| Was | Now |
|---|---|
| `<style>` block | `css/*.css`, `css/apps/messenger.css` |
| base64 images in CSS | `system/ui/*.png` |
| base64 icons in HTML | `system/icons/*.png`, `system/ui/menu-*.png` |
| Start menu markup | built from `js/config/startmenu.js` by `js/core/startmenu.js` |
| desktop icons markup | `settings.desktop` + apps with `desktop: true` |
| window code (open, drag, resize...) | `js/core/windows.js` |
| `content()` My Computer / default | `js/apps/mycomputer.js`, `js/apps/default.js` |
| Internet Explorer code | `js/apps/ie.js` |
| `MS` Messenger code | `js/apps/messenger.js` |
| `CUSTOM` website app | `js/apps/custom.js` |
