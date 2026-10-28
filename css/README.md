# Themes (placeholder)

A theme is one stylesheet in this folder that overrides the look of `css/*.css`.

1. Put your images in `system/themes/<name>/` (taskbar, window frame, buttons...). The images the default
   look uses are in `system/ui/` - copy those names and replace the pictures.
2. Write `css/themes/<name>.css`. Only override what changes, e.g.

   ```css
   #taskbar { background-image: url(../../system/themes/olive/taskbar.png); }
   .win .cap { border-image-source: url(../../system/themes/olive/cap.png); }
   :root { --xp-window-bg: #eef0e0; --xp-select: #5a7d2a; }
   ```
3. Register it (for example at the bottom of `js/core/theme.js`, or from an app):

   ```js
   XP.theme.register("olive", { name: "Olive Green", css: "css/themes/olive.css" });
   ```
4. Switch with `XP.theme.set("olive")`, or set `theme: "olive"` in `js/config/settings.js`.

Quick colour changes need no theme at all: edit the two variables in `css/theme.css`.
