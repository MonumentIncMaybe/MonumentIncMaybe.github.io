/* login.js - XP.login: the Windows XP "Welcome" screen.
 *
 *   XP.login.show()       show the login screen (windows are closed first when logging off)
 *   XP.login.logoff()     close every window, then show the login screen   (Start menu > Log Off)
 *   XP.login.shutdown()   "Windows is shutting down" -> a black screen; click it to start again
 *
 * Settings live in js/config/settings.js:
 *     login: { enabled: true, password: "1234" }
 *
 * IMPORTANT - this is a look-and-feel gate, not security. The page is static, so the password sits
 * in plain text in settings.js and anyone who opens DevTools can read it or skip the screen.
 * To protect something for real you need a server (see the "SERVER-SIDE LOGIN" note below).
 *
 * SERVER-SIDE LOGIN (placeholder): replace `check()` with a request to your backend, e.g.
 *     fetch("/api/login", { method: "POST", body: JSON.stringify({ user, password }) }).then(r => r.ok)
 * and let the server set a session cookie. The rest of this file does not need to change.
 */
window.XP = window.XP || {};

(function () {
  const ui = f => "system/ui/" + f;
  let el = null, busy = false, firstShow = true;

  const cfg = () => Object.assign({ enabled: true, password: "1234" }, XP.settings && XP.settings.login);
  const check = pw => pw === cfg().password;     // <- swap for a server call (see header)

  function build() {
    if (el) return el;
    el = document.getElementById("login");
    if (!el) { el = document.createElement("div"); el.id = "login"; document.body.appendChild(el); }
    return el;
  }

  function render() {
    const name = XP.esc(XP.settings.userName || "Owner");
    el.className = "show";
    el.innerHTML =
      `<div class="lg-top"></div>
       <div class="lg-mid">
         <div class="lg-left">
           <div class="lg-logo"><img src="${ui("flag.png")}" alt=""><b>Windows<em>xp</em></b></div>
           <div class="lg-begin">To begin, click your user name</div>
         </div>
         <div class="lg-divider"></div>
         <div class="lg-right">
           <div class="lg-user" tabindex="0">
             <img class="lg-av" src="${ui("owner-login.png")}" alt="">
             <div>
               <div class="nm">${name}</div>
               <div class="lg-pw">
                 <small>Type your password</small>
                 <div class="row"><input type="password" autocomplete="off" spellcheck="false"><button class="lg-go" title="Log on"></button></div>
                 <div class="lg-err"></div>
               </div>
             </div>
           </div>
         </div>
         <div class="lg-msg"></div>
       </div>
       <div class="lg-bot">
         <div class="lg-off"><img src="${XP.icons.get("power")}" alt="">Turn off computer</div>
         <div class="lg-note">After you log on, you can add or change accounts.<br>Just go to Control Panel and click User Accounts.</div>
       </div>`;

    const q = s => el.querySelector(s), user = q(".lg-user"), inp = q(".lg-pw input"), err = q(".lg-err");
    const open = () => { user.classList.add("open"); setTimeout(() => inp.focus(), 0); };
    user.addEventListener("click", e => { if (!user.classList.contains("open")) open(); e.stopPropagation(); });
    user.addEventListener("keydown", e => { if (e.key === "Enter" && !user.classList.contains("open")) open(); });
    q(".lg-off").onclick = shutdown;

    const attempt = async () => {
      if (busy) return;
      busy = true;
      let ok = false;
      try { ok = await check(inp.value); } catch (e) {}
      busy = false;
      if (ok) return welcome();
      err.textContent = "Incorrect password. Please try again.";
      inp.value = ""; inp.focus();
      user.classList.remove("shake"); void user.offsetWidth; user.classList.add("shake");
    };
    q(".lg-go").onclick = attempt;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); else err.textContent = ""; });
    if (cfg().password === "") open();
  }

  function message(text, cls) {
    el.className = "show msg" + (cls ? " " + cls : "");
    el.querySelector(".lg-msg").textContent = text;
  }

  function welcome() {
    message("welcome");
    try { const a = XP.$("startup-sound"); if (a) { a.currentTime = 0; a.play().catch(() => {}); } } catch (e) {}   // the startup sound plays only here, after a successful login
    setTimeout(() => { el.classList.add("fade"); setTimeout(() => { el.className = ""; el.innerHTML = ""; }, 480); }, 1300);
  }

  function show() {
    build();
    XP.startMenu && XP.startMenu.hide();
    XP.contextMenu && XP.contextMenu.hide();
    render();
  }

  function closeAll() { XP.windows.list().forEach(w => XP.windows.close(w)); }

  function logoff() {
    XP.startMenu.hide();
    build(); closeAll();
    el.className = "show"; el.innerHTML = '<div class="lg-top"></div><div class="lg-mid"><div class="lg-msg"></div></div><div class="lg-bot"></div>';
    message("Logging off...");
    setTimeout(show, 900);
  }

  function shutdown() {
    XP.startMenu && XP.startMenu.hide();
    build(); closeAll();
    el.className = "show"; el.innerHTML = '<div class="lg-top"></div><div class="lg-mid"><div class="lg-msg"></div></div><div class="lg-bot"></div>';
    message("Windows is shutting down...");
    setTimeout(() => {
      message("It is now safe to turn off your computer.  (Click anywhere to start again.)", "off");
      el.addEventListener("click", show, { once: true });
    }, 1400);
  }

  XP.login = { show, logoff, shutdown };

  /* Show immediately (before the desktop finishes loading), then wire the Start menu buttons. */
  /* desktop.js plays the startup sound on the first click; with a login screen that click is the
     login tile, so mark it as "already played" - welcome() plays the sound after you log in instead. */
  if (cfg().enabled) { window.played = 1; show(); }
  else { const l = document.getElementById("login"); if (l) l.className = ""; }
  document.addEventListener("xp:ready", () => {
    const fbs = document.querySelectorAll("#menu .fb");
    if (fbs[0]) fbs[0].addEventListener("click", e => { e.stopPropagation(); logoff(); });
    if (fbs[1]) fbs[1].addEventListener("click", e => { e.stopPropagation(); shutdown(); });
  });
})();
