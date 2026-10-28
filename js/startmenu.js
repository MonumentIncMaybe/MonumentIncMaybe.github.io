/* startmenu.js - builds the Start menu from XP.startMenuConfig (js/config/startmenu.js).
 *
 *   XP.startMenu.toggle() / show() / hide() / contains(node)
 *
 * The decoration images (header, side panels, separators, footer) live in system/ui/menu-*.png.
 * Their positions are part of the XP skin and are fixed here, in the same stacking order as the original.
 */
window.XP = window.XP || {};

(function () {
  const $ = XP.$, IC = XP.icons.get, ui = f => "system/ui/" + f;
  const bg = (file, style) => `<img class="bg" style="${style}" src="${ui(file)}" alt="">`;

  function item(side, it) {
    const icon = it.icon || it.app;
    if (side === "l") {
      const inner = it.title ? `<b>${it.title}</b><small>${it.sub || ""}</small>` : it.label;
      return `<div class="it l" style="top:${it.top}px" data-app="${it.app}"><img data-ic="${icon}" src="${IC(icon)}" width="32" height="32" alt=""><span>${inner}</span></div>`;
    }
    return `<div class="it r" style="top:${it.top}px" data-app="${it.app}"><img data-ic="${icon}" src="${IC(icon)}" alt=""><span>${it.label}</span></div>`;
  }

  XP.startMenu = {
    build() {
      const S = XP.settings, C = XP.startMenuConfig;
      $("menu").innerHTML =
        bg("menu-header.png", "left:0;top:0") +
        `<img class="bg" style="left:3px;top:3px;width:55px;height:55px" src="${ui("menu-avatar-frame.png")}" alt="">` +
        `<img class="bg" style="left:9px;top:9px;width:44px;height:44px" src="${S.userPicture}" alt="">` +
        `<div id="uname">${XP.esc(S.userName)}</div>` +
        bg("menu-left.png", "left:0;top:62px") +
        bg("menu-right.png", "left:192px;top:62px") +
        bg("menu-sep-left.png", "left:10px;top:142px") +
        bg("menu-sep-left.png", "left:10px;top:386px") +
        bg("menu-sep-right.png", "left:216px;top:193px") +
        bg("menu-sep-right.png", "left:216px;top:262px") +
        bg("menu-allprograms.png", "left:0;top:400px;width:192px;height:36px") +
        `<div class="it l" style="top:400px;font-weight:bold;color:#373738;height:36px;justify-content:center;gap:0"><span>All <u>P</u>rograms </span><img src="${ui("menu-arrow.png")}" alt="" style="margin-left:8px"></div>` +
        C.left.map(i => item("l", i)).join("") +
        C.right.map(i => item("r", i)).join("") +
        bg("menu-footer.png", "left:0;top:436px") +
        `<div class="fb" style="left:176px"><img src="${ui("menu-logoff.png")}" width="24" height="24" alt="">Log Off </div>` +
        `<div class="fb" style="left:248px"><img src="${ui("menu-turnoff.png")}" width="24" height="24" alt="">Turn Off Computer </div>`;

      $("menu").querySelectorAll(".it[data-app]").forEach(it => it.addEventListener("click", e => {
        e.stopPropagation();
        XP.startMenu.hide();
        XP.open(it.dataset.app);
      }));
    },

    toggle() { $("menu").classList.toggle("show"); $("start").classList.toggle("on"); },
    hide()   { $("menu").classList.remove("show"); $("start").classList.remove("on"); },
    show()   { $("menu").classList.add("show"); $("start").classList.add("on"); },
    contains: node => $("menu").contains(node)
  };
})();
