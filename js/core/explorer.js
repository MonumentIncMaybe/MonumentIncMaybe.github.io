/* explorer.js - XP.ui: the markup pieces shared by "explorer-style" windows
 * (menu bar, toolbar buttons, address bar, status bar). Used by My Computer, Internet Explorer
 * and the default app, and available to your apps too:
 *
 *   XP.ui.menubar()            File / Edit / View ... strip with the XP flag on the right
 *   XP.ui.nav()                Back / Forward / Up / Search / Folders toolbar
 *   XP.ui.addr(iconName, text) read-only address bar
 *   XP.ui.tb(label, iconHtml, extraClass)   one toolbar button ("dis" = greyed, "sm" = small)
 *   XP.ui.BACK, FWD, BACKD, FWDD, STOP, REF, HOME, UP    the round/green SVG toolbar icons
 */
window.XP = window.XP || {};

(function () {
  const IC = XP.icons.get;

  const svg=(b,i)=>`<svg viewBox="0 0 22 22">${i}</svg>`,
  circ=(c,a)=>svg(0,`<circle cx="11" cy="11" r="9.5" fill="${c}" stroke="#fff" stroke-opacity=".7"/><path d="${a}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  BACK=circ("#3aa83a","M13.5 6 8 11l5.5 5M8 11h8"),
  FWD=circ("#3aa83a","M8.5 6 14 11l-5.5 5M14 11H6"),
  BACKD=circ("#a9b6a9","M13.5 6 8 11l5.5 5M8 11h8"),
  FWDD=circ("#a9b6a9","M8.5 6 14 11l-5.5 5M14 11H6"),
  STOP=svg(0,'<rect x="3" y="3" width="16" height="16" rx="2" fill="#fff" stroke="#8a8a82"/><path d="M7 7l8 8M15 7l-8 8" stroke="#d62a1c" stroke-width="3" stroke-linecap="round"/>'),
  REF=svg(0,'<rect x="3" y="3" width="16" height="16" rx="2" fill="#fff" stroke="#8a8a82"/><path d="M6 11a5 5 0 0 1 9-3M16 11a5 5 0 0 1-9 3" stroke="#2f9e2f" stroke-width="2.4" fill="none"/>'),
  HOME=svg(0,'<path d="M2 11 11 3l9 8h-3v7H5v-7z" fill="#f4e9b8" stroke="#8a6d1f"/><rect x="9" y="12" width="4" height="6" fill="#7a4a1a"/>'),
  UP=svg(0,'<path d="M3 17V7h6l2 2h8v8z" fill="#f7d96b" stroke="#a88a1f"/><path d="M11 15v-5m-3 2 3-3 3 3" stroke="#2f9e2f" stroke-width="2" fill="none"/>'),
  MENUBAR='<div class="mb"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span><img src="__LOGO__" alt=""></div>',
  tb=(t,i,c="")=>`<div class="tbn ${c}">${i}${t?`<span>${t}</span>`:""}</div>`;

  XP.ui = {
    svg, BACK, FWD, BACKD, FWDD, STOP, REF, HOME, UP, tb,

    menubar: () => MENUBAR.replace("__LOGO__", IC("tour")),

    nav: () => `<div class="tbar">${tb("Back", BACKD, "dis")}${tb("", FWDD, "dis")}${tb("", UP, "sm")}<div class="tsep"></div>${tb("Search", `<img src="${IC("search")}">`)}${tb("Folders", `<img src="${IC("folder")}">`)}</div>`,

    addr: (iconName, text) => `<div class="abar">Address<div class="inp"><img src="${IC(iconName)}"><input value="${text}" readonly></div><span class="go"><i></i>Go</span></div>`
  };
})();
