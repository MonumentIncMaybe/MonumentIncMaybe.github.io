/* shell.js - window titles for the built-in ids.
 *
 * These ids (Start menu / desktop entries) don't have their own script yet, so they open the
 * default app (js/apps/default.js), which looks up its title here. Give one a real app by
 * creating js/apps/<id>.js and adding <id> to XP.settings.apps.
 */
window.XP = window.XP || {};

XP.shell = {
  ie:     "Welcome to MSN.com - Microsoft Internet Explorer",
  msn:    "MSN.com - Microsoft Internet Explorer",
  mail:   "Outlook Express",
  wmp:    "Windows Media Player",
  msg:    "Windows Messenger",
  tour:   "Tour Windows XP",
  xfer:   "Files and Settings Transfer Wizard",
  docs:   "My Documents",
  pics:   "My Pictures",
  music:  "My Music",
  mc:     "My Computer",
  cp:     "Control Panel",
  spa:    "Set Program Access and Defaults",
  help:   "Help and Support Center",
  search: "Search Results",
  run:    "Run",
  rb:     "Recycle Bin"
};
