/* util.js - tiny helpers shared by everything. */
window.XP = window.XP || {};

XP.$ = id => document.getElementById(id);

/* Escape text before putting it in innerHTML. */
XP.esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Small persistent key/value store for apps and settings (localStorage, never throws).
   Keys are prefixed with "xp." so they can't clash with other pages on the same origin. */
XP.storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem("xp." + key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("xp." + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem("xp." + key); } catch (e) {}
  }
};
