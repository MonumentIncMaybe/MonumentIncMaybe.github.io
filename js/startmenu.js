/* startmenu.js - what appears in the Start menu.
 *
 * Each entry: { app, top, ... }
 *   app    id of the app to open (also the icon name, unless `icon` is given)
 *   top    vertical position in px inside the menu
 *   Left column:  `title` + `sub` for the two-line pinned items, or just `label`
 *   Right column: `label`
 */
window.XP = window.XP || {};

XP.startMenuConfig = {
  left: [
    { app: "ie",   top: 66,  title: "Internet", sub: "Internet Explorer" },
    { app: "mail", top: 106, title: "E-mail",   sub: "Outlook Express" },
    { app: "msn",  top: 159, label: "MSN" },
    { app: "wmp",  top: 199, label: "Windows Media Player" },
    { app: "msg",  top: 239, label: "Windows Messenger" },
    { app: "tour", top: 279, label: "Tour Windows XP" },
    { app: "xfer", top: 319, label: "Files and Settings Transfer Wizard" }
  ],
  right: [
    { app: "docs",   top: 69,  label: "My Documents" },
    { app: "pics",   top: 99,  label: "My Pictures" },
    { app: "music",  top: 129, label: "My Music" },
    { app: "mc",     top: 159, label: "My Computer" },
    { app: "cp",     top: 197, label: "Control Panel" },
    { app: "spa",    top: 227, label: "Set Program Access and Defaults" },
    { app: "help",   top: 265, label: "Help and Support" },
    { app: "search", top: 295, label: "Search" },
    { app: "run",    top: 325, label: "Run…" }
  ]
};
