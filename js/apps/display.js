/* display.js - Display Properties (id "display").
 * Open it from the desktop: right-click > Properties.
 *
 *  Desktop tab   pick a built-in wallpaper (XP.theme.wallpapers), or Browse... to upload your own
 *                picture (kept in this browser only - see js/core/filestore.js), choose its position
 *                and the background colour. "Delete" removes an uploaded picture.
 *  Themes tab    only "Windows XP" for now (XP.theme.list()); more can be registered later
 *                (see css/themes/README.md) and will show up here automatically.
 */
(function () {
  const IC = XP.icons.get;
  const MODES = [["cover", "Fill"], ["stretch", "Stretch"], ["center", "Center"], ["tile", "Tile"]];

  XP.apps.register({
    id: "display",
    title: "Display Properties",
    icon: "display",
    size: { w: 404, h: 502 },
    css: ["css/apps/display.css"],

    content: () => `
      <div class="dp">
        <div class="dp-tabs"><div class="dp-tab" data-p="themes">Themes</div><div class="dp-tab on" data-p="desktop">Desktop</div></div>

        <div class="dp-page" data-p="themes">
          <h5>A theme is a background plus a set of sounds, icons, and other elements.</h5>
          <h5 style="margin-top:12px">Theme:</h5>
          <select class="thm"></select>
          <p style="color:#808080;margin-top:14px">More themes can be added later (see css/themes/README.md).</p>
        </div>

        <div class="dp-page on" data-p="desktop">
          <div class="dp-mon"><div class="bezel"><div class="scr"></div></div><div class="stand"></div><div class="base"></div></div>
          <h5>Background:</h5>
          <div class="dp-row">
            <ul class="dp-list"></ul>
            <div class="dp-side">
              <button class="xp-btn" data-do="browse">Browse...</button>
              <button class="xp-btn" data-do="delete" disabled>Delete</button>
            </div>
          </div>
          <div class="dp-opts">
            <label>Position: <select class="pos">${MODES.map(m => `<option value="${m[0]}">${m[1]}</option>`).join("")}</select></label>
            <label>Color: <input type="color" class="clr" value="#3a6ea5"></label>
          </div>
          <div class="dp-msg"></div>
          <input type="file" class="file" accept="image/*" multiple hidden>
        </div>

        <div class="dp-foot">
          <button class="xp-btn" data-do="ok">OK</button>
          <button class="xp-btn" data-do="cancel">Cancel</button>
          <button class="xp-btn" data-do="apply" disabled>Apply</button>
        </div>
      </div>`,

    onOpen(win) {
      const $ = s => win.body.querySelector(s), $$ = s => [...win.body.querySelectorAll(s)];
      const list = $(".dp-list"), scr = $(".dp-mon .scr"), pos = $(".pos"), clr = $(".clr"), msg = $(".dp-msg"), file = $(".file"),
            apply = $('[data-do="apply"]'), del = $('[data-do="delete"]'), thm = $(".thm");

      const original = { wp: Object.assign({}, XP.theme.wallpaper), color: document.getElementById("desktop").style.backgroundColor };
      let entries = [], sel = XP.theme.wallpaper.src, mode = XP.theme.wallpaper.mode || "cover";
      const toHex = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ""); return m ? "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("") : "#3a6ea5"; };
      let color = toHex(original.color);
      clr.value = color; pos.value = mode;

      thm.innerHTML = XP.theme.list().map(t => `<option value="${t.id}"${t.id === XP.theme.current ? " selected" : ""}>${XP.esc(t.name)}</option>`).join("");
      thm.onchange = () => { XP.theme.set(thm.value); };

      const dirty = () => { apply.disabled = false; };

      async function preview() {
        const u = await XP.theme.resolve(sel);
        scr.style.backgroundImage = u ? `url("${u}")` : "none";
        scr.style.backgroundColor = color;
        const m = { cover: ["cover", "center", "no-repeat"], stretch: ["100% 100%", "center", "no-repeat"], center: ["auto", "center", "no-repeat"], tile: ["40px", "0 0", "repeat"] }[mode];
        [scr.style.backgroundSize, scr.style.backgroundPosition, scr.style.backgroundRepeat] = m;
      }

      async function refresh() {
        const custom = await XP.theme.customWallpapers();
        entries = [{ name: "(None)", src: null }]
          .concat(XP.theme.wallpapers.map(w => ({ name: w.name, src: w.src })))
          .concat(custom.map(c => ({ name: c.name, src: c.src, id: c.id, custom: true })));
        list.innerHTML = "";
        entries.forEach(en => {
          const li = document.createElement("li");
          li.className = en.src === sel ? "on" : "";
          li.innerHTML = `<img src="${IC(en.src ? "pics" : "display")}" alt=""><span></span>`;
          li.lastChild.textContent = en.name;
          li.onclick = () => { sel = en.src; refresh(); dirty(); };
          list.appendChild(li);
        });
        const cur = entries.find(e => e.src === sel);
        del.disabled = !(cur && cur.custom);
        const on = list.querySelector("li.on"); if (on) on.scrollIntoView({ block: "nearest" });
        preview();
      }

      $('[data-do="browse"]').onclick = () => file.click();
      file.onchange = async () => {
        const files = [...file.files].filter(f => /^image\//.test(f.type));
        file.value = "";
        if (!files.length) { msg.textContent = "Please choose an image file (JPG, PNG, GIF, BMP, WebP)."; return; }
        let last = null;
        for (const f of files) last = await XP.theme.addCustomWallpaper(f);
        sel = last.src; msg.textContent = "";
        await refresh(); dirty();
      };

      del.onclick = async () => {
        const cur = entries.find(e => e.src === sel);
        if (!cur || !cur.custom) return;
        sel = XP.settings.wallpaper.src;
        await XP.theme.removeCustomWallpaper(cur.id);
        original.wp = Object.assign({}, XP.theme.wallpaper);
        msg.textContent = "Removed " + cur.name + ".";
        refresh();
      };

      pos.onchange = () => { mode = pos.value; preview(); dirty(); };
      clr.oninput = () => { color = clr.value; preview(); dirty(); };

      const commit = () => {
        XP.theme.setWallpaper(sel, mode);
        XP.theme.setBackgroundColor(color);
        original.wp = { src: sel, mode }; original.color = color;
        apply.disabled = true;
      };
      $('[data-do="apply"]').onclick = commit;
      $('[data-do="ok"]').onclick = () => { if (!apply.disabled) commit(); win.close(); };
      $('[data-do="cancel"]').onclick = () => win.close();

      $$(".dp-tab").forEach(t => t.onclick = () => {
        $$(".dp-tab").forEach(x => x.classList.toggle("on", x === t));
        $$(".dp-page").forEach(p => p.classList.toggle("on", p.dataset.p === t.dataset.p));
      });

      refresh();
    }
  });
})();
