/* mycomputer.js - My Computer (id "mc"): the drives / folders window. */
(function () {
  const IC = XP.icons.get, ui = XP.ui;

  const ent = (i, a, b) => `<div class="ent"><img src="${IC(i)}"><div>${a}${b ? `<small>${b}</small>` : ""}</div></div>`;

  XP.apps.register({
    id: "mc",
    title: "My Computer",
    icon: "mc",
    size: { w: 560, h: 400 },
    content: () => ui.menubar() + ui.nav() + ui.addr("mc", "My Computer") +
      `<div class="mcbody"><div class="pane"><div class="pbox"><h4>System Tasks</h4><div>View system information</div><div>Add or remove programs</div><div>Change a setting</div></div><div class="pbox"><h4>Other Places</h4><div>My Network Places</div><div>My Documents</div><div>Control Panel</div></div></div><div class="list"><h4>Files Stored on This Computer</h4>${ent("folder", "Shared Documents", "File Folder")}${ent("docs", XP.esc(XP.settings.userName) + "\u2019s Documents", "File Folder")}<h4>Hard Disk Drives</h4>${ent("hdd", "Local Disk (C:)", "Local Disk")}<h4>Devices with Removable Storage</h4>${ent("cd", "CD Drive (D:)", "CD Drive")}</div></div><div class="sbar"><span>4 objects</span><div class="sp"><img src="${IC("mc")}" width="16" height="16"><span>My Computer</span></div></div>`
  });
})();
