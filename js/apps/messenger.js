/* messenger.js - Windows Messenger (id "msg") and its conversation windows (id "chat"), backed by SUPABASE.
 *
  /* ---------- Supabase ---------- */
  const SB = (() => {
    let sb = null, user = null, presence = null, inbox = null, profiles = [], tried = {}, me = { status: "online" };

    const client = async () => {
      if (sb) return sb;
      if (!window.supabase) await XP.loadScript(SUPABASE_JS);
      if (!window.supabase) throw new Error("Could not load the Supabase library. Check your internet connection.");
      return (sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    };
    const toUser = u => ({
      id: u.id,
      email: u.email || "",
      name: (u.user_metadata && u.user_metadata.display_name) || (u.email || "user").split("@")[0]
    });
    const fail = e => { if (e) throw new Error(e.message || String(e)); };

    /* The buddy list = every profile except mine. (Filter here for private contact lists.) */
    const loadProfiles = async () => {
      const r = await sb.from("profiles").select("id,display_name").neq("id", user.id).order("display_name");
      if (!r.error) profiles = r.data || [];
    };

    return {
      demo: false,

      async restore() {
        try {
          await client();
          const r = await sb.auth.getSession();
          return r.data && r.data.session ? toUser(r.data.session.user) : null;
        } catch (e) { return null; }
      },

      async signIn(email, pw) {
        await client();
        const r = await sb.auth.signInWithPassword({ email, password: pw });
        fail(r.error);
        return toUser(r.data.user);
      },

      async signUp(email, pw, name) {
        await client();
        const r = await sb.auth.signUp({ email, password: pw, options: { data: { display_name: name } } });
        fail(r.error);
        if (!r.data.session) throw new Error("Account created. Check your e-mail to confirm it, then sign in.");
        return toUser(r.data.user);
      },

      async start(u, emit) {
        await client();
        user = u; tried = {}; me = { status: "online" };
        fail((await sb.from("profiles").upsert({ id: u.id, display_name: u.name })).error);
        await loadProfiles();

        /* Presence: who has Messenger open right now, and with what status. */
        const push = () => {
          const st = presence.presenceState();
          const unknown = Object.keys(st).find(k => k !== u.id && !tried[k] && !profiles.some(p => p.id === k));
          if (unknown) { tried[unknown] = 1; loadProfiles().then(push); return; }   // someone just signed up
          emit.contacts(profiles.map(p => {
            const m = st[p.id] && st[p.id][0], on = m && m.status !== "off";
            return { id: p.id, name: p.display_name, status: on ? m.status : "off", msg: "" };
          }));
        };
        presence = sb.channel("xp-messenger", { config: { presence: { key: u.id } } });
        presence.on("presence", { event: "sync" }, push)
                .subscribe(s => { if (s === "SUBSCRIBED") presence.track(me); });
        push();

        /* New messages addressed to me, pushed live (needs the `alter publication` line from step 4). */
        inbox = sb.channel("xp-inbox-" + u.id)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "to_id=eq." + u.id },
              p => emit.message({ from: p.new.from_id, body: p.new.body, at: p.new.created_at }))
          .subscribe();
      },

      setStatus(s) { me = { status: s }; if (presence) presence.track(me); },

      async history(id) {
        const r = await sb.from("messages").select("from_id,body,created_at")
          .or(`and(from_id.eq.${user.id},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${user.id})`)
          .order("created_at", { ascending: false }).limit(30);
        fail(r.error);
        return (r.data || []).reverse().map(m => ({ mine: m.from_id === user.id, body: m.body, at: m.created_at }));
      },

      async send(id, body) { fail((await sb.from("messages").insert({ from_id: user.id, to_id: id, body })).error); },

      async stop() {
        try { if (presence) await sb.removeChannel(presence); if (inbox) await sb.removeChannel(inbox); await sb.auth.signOut(); } catch (e) {}
        presence = inbox = user = null; profiles = [];
      }
    };
  })();

  /* ---------- Offline demo (used while SUPABASE_URL / SUPABASE_ANON_KEY are empty) ---------- */
  const DEMO = (() => {
    const CT = [["Alex", "online", "Working on something cool"], ["Sam", "online", "listening to music"], ["Casey", "online", ""],
                ["Jordan", "busy", "In a meeting"], ["Taylor", "away", "brb"], ["Morgan", "off", ""], ["Riley", "off", ""]]
                .map(c => ({ id: c[0], name: c[0], status: c[1], msg: c[2] }));
    const REPLY = ["Hey! This is a placeholder chat, so I can only give canned answers :)", "Real messaging isn't hooked up yet, but the window works!",
      "Interesting... tell me more (this reply is pre-written).", "LOL :D", "brb, grabbing a snack (L)", "Did you see that new wallpaper? Bliss forever.",
      "I'm just a placeholder contact, but I'm listening.", "Nice! (Y)", "Hmm, let me think about that... :S", "ttyl! (this is not a real person)"];
    let E = null;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    return {
      demo: true, REPLY,
      async restore() { return null; },
      async signIn(email) { await wait(900); return { id: "owner", name: XP.settings.userName, email: email || "owner@hotmail.com" }; },
      async signUp(email, pw, name) { await wait(900); return { id: "owner", name: name || XP.settings.userName, email: email || "owner@hotmail.com" }; },
      async start(u, emit) { E = emit; emit.contacts(CT.map(c => Object.assign({}, c))); },
      setStatus() {},
      async history() { return []; },
      async send(id) {
        const c = CT.find(x => x.id === id);
        if (c && c.status !== "off")
          setTimeout(() => E && E.message({ from: id, body: REPLY[Math.random() * REPLY.length | 0] }), 1600 + Math.random() * 1400);
      },
      greet(id) { setTimeout(() => E && E.message({ from: id, body: "Hi " + XP.settings.userName + "! " + REPLY[0] }), 900); },
      async stop() { E = null; }
    };
  })();

  const B = LIVE ? SB : DEMO;

  /* ---------------------------------------------------------------------------------------------
   * MESSENGER UI
   * ------------------------------------------------------------------------------------------- */
  const MS = (() => {
    const E = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
          Q = (e, s) => e.querySelector(s),
          ST = { online: ["Online", 0], busy: ["Busy", 1], brb: ["Be Right Back", 3], away: ["Away", 3], off: ["Appear Offline", 0] },
          EM = { ":)": 0, ":-)": 0, ":D": 1, ":d": 1, ";)": 2, ";-)": 2, ":O": 3, ":o": 3, ":P": 4, ":p": 4, "(H)": 5, "(h)": 5, ":@": 6, ":$": 7, ":S": 8, ":s": 8, ":(": 9, ":-(": 9, ":'(": 10, ":|": 11, "(6)": 12, "(A)": 13, "(a)": 13, "(L)": 14, "(l)": 14, "(U)": 15, "(u)": 15, "(*)": 20, "(E)": 22, "(e)": 22, "(F)": 24, "(f)": 24, "(K)": 27, "(k)": 27, "(G)": 28, "(g)": 28, "(^)": 29, "(Y)": 40, "(y)": 40, "(N)": 41, "(n)": 41, "(R)": 46, "(r)": 46 },
          ER = new RegExp(Object.keys(EM).map(k => k.replace(/[()*^$|]/g, "\\$&")).join("|"), "g"),
          fmt = t => E(t).replace(ER, m => `<i class="em" style="background-position:-${EM[m] * 19}px 0"></i>`),
          now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          ico = s => `<i class="st${s === "off" ? " off" : ""}" style="background-position:-${ST[s][1] * 16}px 0"></i>`,
          menu = a => `<div class="mb">${a.map(x => `<span>${x}</span>`).join("")}</div>`;

    /* Shared state (lives outside any one window so chats keep working if the buddy list is closed). */
    let me = null, mine = "online", contacts = [];
    const lists = new Set();        // repaint callbacks, one per open buddy-list window
    const chats = new Map();        // contact id -> function(body) that prints an incoming message
    const NAME = () => (me ? me.name : XP.settings.userName);
    const signed = () => !!me;

    const emit = {
      contacts(list) { contacts = list; lists.forEach(f => f()); },
      message(m) {
        const open = chats.get(m.from);
        if (open) open(m.body);
        else chatWith(m.from, B.demo ? [m] : []);   // live mode: the history query already contains it
      }
    };

    const html = k => k === "chat"
      ? menu(["File", "Edit", "Actions", "Tools", "Help"]) + `<div class="ch"><div class="ch-to">To: <b></b></div><div class="ch-bd"><div class="ch-l"><div class="ch-tx"></div><div class="ch-em">${[0, 1, 2, 3, 4, 9, 14, 40].map(i => `<i data-i="${i}" class="em" style="background-position:-${i * 19}px 0"></i>`).join("")}</div><div class="ch-in"><textarea spellcheck="false"></textarea><button class="msb">Send</button></div></div><div class="ch-r"><img class="cp" src="system/msn/buddy.png" alt=""><img src="system/msn/owner.png" alt=""></div></div><div class="ch-st"></div></div>`
      : menu(["File", "Contacts", "Actions", "Tools", "Help"]) + `<div class="ms"><div class="ms-in"><img src="system/msn/logo.png" alt=""><h3>.NET Messenger Service</h3>`
        + `<label class="ms-nm" hidden>Display name:<input type="text" maxlength="24" spellcheck="false"></label>`
        + `<label>E-mail address:<input class="ms-em" type="text" value="${B.demo ? "owner@hotmail.com" : ""}" spellcheck="false"></label>`
        + `<label>Password:<input class="ms-pw" type="password" value="${B.demo ? "********" : ""}"></label>`
        + `<label class="chk"><input type="checkbox" checked>Sign me in automatically</label>`
        + `<button class="msb">Sign In</button>`
        + `<div class="ms-err" style="color:#c00;text-align:center;min-height:14px"></div>`
        + `<a class="ms-new" ${B.demo ? "hidden" : ""} style="color:#0033cc;text-decoration:underline;cursor:pointer">Get a new account</a>`
        + `</div><div class="ms-hd" hidden><img src="system/msn/owner.png" alt=""><div><b></b><small class="em"></small><br><select>${Object.entries(ST).map(([v, s]) => `<option value="${v}">${s[0]}</option>`).join("")}<option value="out">Sign Out</option></select></div></div><div class="ms-ls" hidden></div><div class="ms-ft" hidden><span></span><span>MSN Messenger</span></div></div>`;

    function main(w) {
      const el = w.el, $ = s => Q(el, s), inV = $(".ms-in"), hd = $(".ms-hd"), ls = $(".ms-ls"), ft = $(".ms-ft"),
            sel = $(".ms-hd select"), btn = $(".ms-in .msb"), err = $(".ms-err"), nmRow = $(".ms-nm");
      let mode = "in";

      const paint = () => {
        const on = contacts.filter(c => c.status !== "off"), of = contacts.filter(c => c.status === "off"),
              row = c => `<div class="ct ${c.status === "off" ? "off" : ""}" data-n="${E(c.id)}">${ico(c.status)}<span>${E(c.name)}</span><small>${c.msg ? "- " + E(c.msg) : ""}</small></div>`;
        ls.innerHTML = `<h5>Online (${on.length})</h5>${on.map(row).join("")}<h5>Not Online (${of.length})</h5>${of.map(row).join("")}`;
        ft.firstChild.textContent = on.length + " contacts online";
        $(".ms-hd b").innerHTML = `${E(NAME())} <small>(${ST[mine][0]})</small>`;
        $(".ms-hd .em").textContent = me ? me.email : "";
      };
      const show = on => { inV.hidden = on; hd.hidden = ft.hidden = ls.hidden = !on; if (on) { sel.value = mine; paint(); } };

      lists.add(paint); w.msPaint = paint;

      const setMode = m => {
        mode = m; nmRow.hidden = m !== "up"; err.textContent = "";
        btn.textContent = m === "up" ? "Sign Up" : "Sign In";
        $(".ms-new").textContent = m === "up" ? "I already have an account" : "Get a new account";
      };
      $(".ms-new").onclick = () => setMode(mode === "up" ? "in" : "up");

      const login = async fn => {
        btn.disabled = true; err.textContent = ""; btn.textContent = mode === "up" ? "Signing up..." : "Signing in...";
        try {
          me = await fn();
          await B.start(me, emit);
          B.setStatus(mine);
          show(true);
          $(".ms-pw").value = B.demo ? "********" : "";
        } catch (e) { me = null; err.textContent = (e && e.message) || String(e); }
        btn.disabled = false; btn.textContent = mode === "up" ? "Sign Up" : "Sign In";
      };

      btn.onclick = () => {
        const email = $(".ms-em").value.trim(), pw = $(".ms-pw").value, name = $(".ms-nm input").value.trim();
        if (!B.demo && (!email || !pw)) { err.textContent = "Type your e-mail address and password."; return; }
        if (mode === "up" && !B.demo && !name) { err.textContent = "Type a display name."; return; }
        login(() => (mode === "up" ? B.signUp(email, pw, name) : B.signIn(email, pw)));
      };

      /* Sign out: stop Supabase (presence + realtime + session), clear state, show the sign-in screen. */
const signOut = () => {
  B.stop();
  me = null; contacts = []; mine = "online";
  chats.clear();
  show(false);
};

/* The status dropdown's "Sign Out" entry uses the same function. */
sel.onchange = () => {
  if (sel.value === "out") return signOut();
  mine = sel.value; B.setStatus(mine); paint();
};

/* File menu: File > Sign Out / Close */
el.querySelectorAll(".mb span").forEach(sp => sp.addEventListener("click", e => {
  if (sp.textContent.trim() !== "File") return;
  e.stopPropagation();
  XP.contextMenu.showAt(sp, [
    { label: "Sign Out", disabled: !signed(), action: signOut },
    "-",
    { label: "Close", action: () => w.close() }
  ]);
}));
      ls.onclick = e => { const c = e.target.closest(".ct"); if (!c) return; ls.querySelectorAll(".ct.sel").forEach(x => x.classList.remove("sel")); c.classList.add("sel"); };
      ls.ondblclick = e => { const c = e.target.closest(".ct"); if (c) chatWith(c.dataset.n); };

      if (signed()) show(true);
      else B.restore().then(u => { if (u && !signed()) login(async () => u); });   // reload: reuse the saved Supabase session
    }

    function chatWith(id, pending) {
      const ex = XP.windows.find(w => w.chat === id);
      if (ex) { if (ex.min) XP.windows.restore(ex); return XP.windows.focus(ex); }
      const c = contacts.find(x => x.id === id);
      if (!c) return;
      XP.open("chat", { title: c.name + " - Conversation", chat: id, c, pending: pending || [] });
    }

    function chat(w, o) {
      const el = w.el, id = o.chat, tx = Q(el, ".ch-tx"), ta = Q(el, "textarea"), stt = Q(el, ".ch-st"),
            cur = () => contacts.find(x => x.id === id) || o.c;
      w.chat = id;
      Q(el, ".ch-to b").textContent = cur().name;
      if (cur().status === "off") Q(el, ".cp").style.filter = "grayscale(1)";

      const add = (cls, who, t) => {
        const p = document.createElement("p");
        p.className = cls;
        p.innerHTML = who ? `<span class="who">${E(who)} says:</span><br>&nbsp;${fmt(t)}` : E(t);
        tx.appendChild(p); tx.scrollTop = tx.scrollHeight;
      };
      const incoming = body => { add("", cur().name, body); stt.textContent = "Last message received at " + now() + "."; };
      chats.set(id, incoming);

      const note = cur().status === "off"
        ? `${cur().name} appears offline. Your messages will be waiting when they next open this chat.`
        : B.demo ? "Placeholder chat: replies are pre-written and nothing is sent anywhere." : "";
      if (note) add("sys", "", note);

      B.history(id)
        .then(list => list.forEach(m => add(m.mine ? "me" : "", m.mine ? NAME() : cur().name, m.body)))
        .catch(e => add("sys", "", "Could not load earlier messages: " + ((e && e.message) || e)))
        .then(() => (o.pending || []).forEach(m => incoming(m.body)));

      const send = () => {
        const t = ta.value.trim(); if (!t) return;
        ta.value = ""; add("me", NAME(), t);
        B.send(id, t).then(() => { stt.textContent = "Last message sent at " + now() + "."; })
                     .catch(e => add("sys", "", "Your message could not be sent: " + ((e && e.message) || e)));
        if (B.demo && cur().status !== "off") setTimeout(() => { stt.textContent = cur().name + " is typing a message."; }, 500);
      };
      Q(el, ".ch-in .msb").onclick = send;
      ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
      el.querySelectorAll(".ch-em i").forEach(i => i.onclick = () => { ta.value += Object.keys(EM).find(k => EM[k] == i.dataset.i); ta.focus(); });

      if (B.demo && cur().status !== "off" && !(o.pending || []).length) B.greet(id);
      setTimeout(() => ta.focus(), 50);
    }

    return { html, main, chat, chatWith, lists, chats };
  })();

  XP.apps.register({
    id: "msg",
    title: "Windows Messenger",
    icon: "msg",
    size: { w: 252, h: 460 },
    css: ["css/apps/messenger.css"],
    content: () => MS.html("msg"),
    onOpen: w => MS.main(w),
    onClose: w => { if (w.msPaint) MS.lists.delete(w.msPaint); }
  });

  /* One window per conversation; opened by double-clicking a contact. Not shown on the desktop. */
  XP.apps.register({
    id: "chat",
    title: o => o.title,
    icon: "msg",
    multi: true,
    size: { w: 500, h: 390 },
    css: ["css/apps/messenger.css"],
    content: () => MS.html("chat"),
    onOpen: (w, o) => MS.chat(w, o),
    onClose: w => MS.chats.delete(w.chat)
  });
})();
