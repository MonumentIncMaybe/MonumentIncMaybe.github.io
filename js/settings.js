/* settings.js - the knobs you are most likely to touch. */
window.XP = window.XP || {};

XP.settings = {
  userName: "Owner",                       // start menu header + Messenger + "Owner's Documents"
  userPicture: "system/ui/menu-avatar.jpg",

  /* Desktop background. mode: "cover" | "center" | "stretch" | "tile".
     Change it at runtime with XP.theme.setWallpaper(src, mode). */
  wallpaper: { src: "system/media/bliss.jpg", mode: "cover" },

  theme: "luna",                           // see js/core/theme.js and css/themes/

  /* Desktop icons, top to bottom. Any app registered with `desktop: true` is appended after these. */
  desktop: ["mc", "rb"],

  /* Apps that have a script: js/apps/<name>.js is loaded at boot, in this order.
     Any id that is NOT listed here (or whose file is missing) opens the default app instead.
     Add "template" to see the demo app that explains the API (js/apps/_template.js).        */
  apps: [
    "mycomputer",
    "ie",
    "messenger",
    "custom"
    // , "_template"
  ],

  /* Remember wallpaper / theme choices between visits (localStorage). */
  persist: true
};
