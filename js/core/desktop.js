/* desktop.js - desktop icons, icon selection, the clock, the Start button, the startup sound.
 *
 * Icons shown: XP.settings.desktop (in order), then every app registered with `desktop: true`.
 * Double-click an icon -> XP.open(its app id).
 */
window.XP = window.XP || {};

(function () {
  const $ = XP.$;

  function select(d, e) {
    e.stopPropagation();
    document.querySelectorAll(".dicon").forEach(x => x.classList.remove("sel"));
    d.classList.add("sel");
  }

  XP.desktop = {
    build() {
      const desk = $("desktop"), ids = XP.settings.desktop.slice();
      XP.apps.list().forEach(a => { if (a.desktop && ids.indexOf(a.id) < 0) ids.push(a.id); });

      /* One column of icons, 74px apart; a second column starts if the screen is too short. */
      const per = Math.max(1, Math.floor((desk.clientHeight - 6) / 74));
      ids.forEach((id, i) => {
        const app = XP.apps.resolve(id);
        const d = document.createElement("div");
        d.className = "dicon";
        d.dataset.app = id;
        d.style.top = (6 + (i % per) * 74) + "px";
        if (i >= per) d.style.left = (8 + Math.floor(i / per) * 84) + "px";

        const img = document.createElement("img");
        img.width = img.height = 32; img.alt = "";
        XP.icons.bind(img, app.icon || id);
        const sp = document.createElement("span");
        sp.textContent = XP.apps.labelOf(id);
        d.append(img, sp);

        d.onclick = e => select(d, e);
        d.addEventListener("dblclick", () => XP.open(d.dataset.app));
        desk.appendChild(d);
      });
    },

    init() {
      /* First click anywhere plays the startup sound (browsers block autoplay before a click). */
      document.addEventListener("click", () => {
        if (!window.played) { window.played = 1; try { $("startup-sound").play() } catch (e) {} }
      }, { once: true });

      /* Clock */
      const tick = () => { $("clock").textContent = (new Date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
      tick();
      setInterval(tick, 15000);

      /* Start button */
      $("start").onclick = e => { e.stopPropagation(); XP.startMenu.toggle(); };

      /* Click on empty space: deselect icons, close the Start menu. */
      document.addEventListener("click", e => {
        document.querySelectorAll(".dicon").forEach(x => x.classList.remove("sel"));
        if (!XP.startMenu.contains(e.target)) XP.startMenu.hide();
      });
    }
  };
})();
