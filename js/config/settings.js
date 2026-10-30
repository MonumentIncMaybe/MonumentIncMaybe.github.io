/* settings.js - the knobs you are most likely to touch. */
window.XP = window.XP || {};

XP.settings = {
  userName: "Owner",                       // start menu header + Messenger + "Owner's Documents"
  userPicture: "system/ui/menu-avatar.jpg",

  /* Desktop background. mode: "cover" | "center" | "stretch" | "tile".
     Change it at runtime with XP.theme.setWallpaper(src, mode). */
  wallpaper: { src: "system/media/bliss.jpg", mode: "cover" },

  theme: "luna",                           // see js/core/theme.js and css/themes/ (only Luna for now)

  /* Login screen shown at start-up and after Start > Log Off.
     This is a look-and-feel gate only: the password is readable by anyone who opens DevTools.
     Set enabled:false to boot straight to the desktop. See js/core/login.js for a server-side note. */
  login: { enabled: true, password: "1234" },

  /* Desktop icons, top to bottom. Any app registered with `desktop: true` is appended after these. */
  desktop: ["mc", "rb"],

  /* Apps that have a script: js/apps/<name>.js is loaded at boot, in this order.
     Any id that is NOT listed here (or whose file is missing) opens the default app instead.
     Add "template" to see the demo app that explains the API (js/apps/template.js).        */
  apps: [
    "mycomputer",
    "ie",
    "messenger",
    "custom",
    "display",        // Display Properties (right-click desktop > Properties): custom backgrounds
    "wmp"             // Windows Media Player: plays files you upload (temporary, nothing saved)
    // , "template"
  ],

  /* Remember wallpaper / theme choices between visits (localStorage). */
  persist: true
};
