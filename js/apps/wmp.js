/* wmp.js - Windows Media Player (id "wmp"): a music player that only plays files YOU upload.
 *
 * Add songs with  File > Open..., the "Add files" button, or by dragging audio files onto the window.
 *
 * TEMPORARY BY DESIGN: nothing is saved. The files are read straight from your computer into the
 * page (blob: URLs); closing the player - or reloading the page - forgets them and frees the memory.
 * Nothing is uploaded to any server. (If you ever want a permanent library, XP.files in
 * js/core/filestore.js stores uploads in IndexedDB the way custom wallpapers are.)
 *
 * LOOK: the buttons, control panel, sliders, task-list gradient and album-art note are the real
 * Windows Media Player 9 bitmaps, extracted from wmploc.dll into system/wmp/ (the rest is CSS).
 * The icon is the real Windows Media Player icon extracted from "XP assets/wmplayer.exe".
 */
(function () {
  const IC = XP.icons.get;
  XP.icons.set("wmp", "system/icons/wmp-real.png");   // real wmplayer.exe icon (desktop, Start menu, title bar)

  const EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|webm|mp4|wma)$/i;
  const fmt = s => (isFinite(s) && s >= 0) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00";
  const nice = n => n.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");

  XP.apps.register({
    id: "wmp",
    title: "Windows Media Player",
    icon: "wmp",
    label: "Windows Media Player",
    desktop: true,
    size: { w: 740, h: 520 },
    css: ["css/apps/wmp.css"],

    content: () => `<div class="mb"><span>File</span><span>View</span><span>Play</span><span>Tools</span><span>Help</span><img src="${IC("tour")}" alt=""></div>` +
      `<div class="wm" tabindex="0">
        <div class="wm-body">
          <div class="wm-nav">
            <div class="it on">Now<br>Playing</div>
            <div class="it dis">Media<br>Guide</div>
            <div class="it dis">Copy from<br>CD</div>
            <div class="it lib">Media<br>Library</div>
            <div class="it dis">Radio<br>Tuner</div>
            <div class="it dis">Copy to CD<br>or Device</div>
            <div class="it dis sub">Premium<br>Services</div>
            <div class="it dis">Skin<br>Chooser</div>
            <div class="foot"></div>
          </div>
          <div class="wm-main">
            <div class="wm-head"></div>
            <div class="wm-vis">
              <canvas></canvas>
              <div class="wm-empty"><img src="${IC("wmp")}" alt=""><div>Drag music files here, or click <b>Add files...</b><br>Songs stay on this page only - they are forgotten when you close the player.</div></div>
            </div>
            <div class="wm-info">
              <button class="wm-vb l" data-do="vprev" title="Previous visualization"></button><button class="wm-vb r" data-do="vnext" title="Next visualization"></button>
              <span class="wm-vn"></span>
              <button class="wm-tg" data-do="shuffle">Shuffle</button><button class="wm-tg" data-do="repeat">Repeat</button>
            </div>
          </div>
          <div class="wm-side">
            <div class="wm-find" data-do="add">Add files...</div>
            <div class="wm-art"></div>
            <ul class="wm-pl"></ul>
            <div class="wm-foot"><a data-do="clear">Clear list</a><span class="wm-ct">0 items</span></div>
          </div>
        </div>
        <div class="wm-bar">
          <div class="wm-song"><i class="tri"></i><span class="wm-st">Ready</span><span class="wm-time">0:00</span></div>
          <button class="wm-btn wm-rew" data-do="rew" title="Rewind"></button>
          <input type="range" class="wm-seek" min="0" max="1000" value="0" step="1">
          <button class="wm-btn wm-ffwd" data-do="ffwd" title="Fast forward"></button>
          <button class="wm-btn wm-play" data-do="play" title="Play"></button>
          <button class="wm-btn wm-stop" data-do="stop" title="Stop"></button>
          <button class="wm-btn wm-prev" data-do="prev" title="Previous"></button>
          <button class="wm-btn wm-next" data-do="next" title="Next"></button>
          <button class="wm-btn wm-mute" data-do="mute" title="Mute"></button>
          <input type="range" class="wm-vol" min="0" max="100" value="80" title="Volume">
        </div>
        <input type="file" class="wm-file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus" multiple hidden>
      </div>`,

    onOpen(win) {
      const $ = s => win.body.querySelector(s);
      const root = $(".wm"), audio = new Audio(), file = $(".wm-file"), pl = $(".wm-pl"), cv = $("canvas"), ctx2 = cv.getContext("2d");
      const seek = $(".wm-seek"), vol = $(".wm-vol"), time = $(".wm-time"), status = $(".wm-st"), count = $(".wm-ct"),
            tTitle = $(".wm-head"), vname = $(".wm-vn"), empty = $(".wm-empty"), playBtn = $('[data-do="play"]'),
            stopBtn = $('[data-do="stop"]'), prevBtn = $('[data-do="prev"]'), nextBtn = $('[data-do="next"]');
      const VIZ = ["Bars : Classic", "Waveform : Scope", "Circles : Pulse"];
      const showViz = () => { vname.textContent = VIZ[vizMode]; };
      const total = () => tracks.reduce((a, x) => a + (isFinite(x.dur) ? x.dur : 0), 0);
      audio.preload = "auto";

      let tracks = [], cur = -1, shuffle = false, repeat = false, seeking = false, vizMode = 0, raf = 0;
      const art = $(".wm-art");
      let ac = null, an = null, data = null;
      const t = { audio, tracks: () => tracks };
      win.wmp = t;

      /* ---------- playlist ---------- */
      function addFiles(list) {
        const files = [...list].filter(f => /^audio\//.test(f.type) || EXT.test(f.name));
        if (!files.length) { status.textContent = "No playable audio files were selected."; return; }
        const first = tracks.length;
        files.forEach(f => {
          const tr = { name: nice(f.name), file: f, url: URL.createObjectURL(f), dur: NaN };
          const probe = new Audio(); probe.preload = "metadata"; probe.src = tr.url;
          probe.onloadedmetadata = () => { tr.dur = probe.duration; render(); };
          tracks.push(tr);
        });
        render();
        if (cur < 0) play(first);
      }

      function render() {
        pl.innerHTML = "";
        tracks.forEach((tr, i) => {
          const li = document.createElement("li");
          li.className = i === cur ? "cur" : "";
          li.innerHTML = '<span class="n"></span><span class="d"></span>';
          li.firstChild.textContent = tr.name; li.lastChild.textContent = isNaN(tr.dur) ? "" : fmt(tr.dur);
          li.ondblclick = () => play(i);
          li.onclick = () => { pl.querySelectorAll(".sel").forEach(x => x.classList.remove("sel")); li.classList.add("sel"); };
          li.addEventListener("contextmenu", e => {
            e.preventDefault(); e.stopPropagation();
            XP.contextMenu.show(e.clientX, e.clientY, [
              { label: "Play", bold: true, action: () => play(i) },
              { label: "Remove from list", action: () => removeAt(i) }
            ]);
          });
          pl.appendChild(li);
        });
        empty.style.display = tracks.length ? "none" : "";
        count.textContent = tracks.length ? "Total Time: " + fmt(total()) : "0 items";
        const none = !tracks.length;
        stopBtn.disabled = prevBtn.disabled = nextBtn.disabled = none;
      }

      function removeAt(i) {
        const wasCur = i === cur;
        URL.revokeObjectURL(tracks[i].url);
        tracks.splice(i, 1);
        if (wasCur) { stop(); cur = -1; if (tracks.length) play(Math.min(i, tracks.length - 1)); else info(); }
        else if (i < cur) cur--;
        render();
      }

      function clearAll() {
        stop(); tracks.forEach(x => URL.revokeObjectURL(x.url)); tracks = []; cur = -1; info(); render();
      }

      /* ---------- transport ---------- */
      function ensureAudioGraph() {
        if (ac) { if (ac.state === "suspended") ac.resume(); return; }
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          const src = ac.createMediaElementSource(audio);
          an = ac.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .8;
          src.connect(an); an.connect(ac.destination);
          data = new Uint8Array(an.frequencyBinCount);
        } catch (e) { ac = null; an = null; }
      }

      function info() {
        const tr = tracks[cur];
        tTitle.textContent = tr ? tr.name : "";
        if (tr) status.textContent = "Song: " + tr.name;
        win.setTitle(tr ? tr.name + " - Windows Media Player" : "Windows Media Player");
      }

      function play(i) {
        if (i == null) {
          if (!tracks.length) { file.click(); return; }
          if (cur < 0) i = 0; else { ensureAudioGraph(); audio.play(); return; }
        }
        cur = i; audio.src = tracks[i].url; info(); render();
        ensureAudioGraph();
        audio.play().catch(() => { status.textContent = "Cannot play this file."; });
      }

      function stop() { audio.pause(); try { audio.currentTime = 0; } catch (e) {} setPlayIcon(false); status.textContent = "Stopped"; }

      function step(dir) {
        if (!tracks.length) return;
        let n;
        if (shuffle && tracks.length > 1) { do { n = Math.floor(Math.random() * tracks.length); } while (n === cur); }
        else n = cur + dir;
        if (n >= tracks.length) n = repeat ? 0 : -1;
        if (n < 0) { if (dir < 0) n = 0; else { stop(); return; } }
        play(n);
      }

      function setPlayIcon(playing) {
        playBtn.classList.toggle("is-pause", playing);
        playBtn.title = playing ? "Pause" : "Play";
      }

      audio.onplay = () => { setPlayIcon(true); if (tracks[cur]) status.textContent = "Song: " + tracks[cur].name; };
      audio.onpause = () => { if (!audio.ended) { setPlayIcon(false); if (audio.currentTime > 0) status.textContent = "Paused: " + (tracks[cur] ? tracks[cur].name : ""); } };
      audio.onwaiting = () => { status.textContent = "Buffering..."; };
      audio.onerror = () => { if (audio.src) status.textContent = "Cannot play this file."; };
      audio.onended = () => step(1);
      audio.ontimeupdate = () => {
        if (!seeking && isFinite(audio.duration)) seek.value = audio.currentTime / audio.duration * 1000;
        time.textContent = fmt(audio.currentTime);
      };
      seek.onpointerdown = () => { seeking = true; };
      seek.onchange = seek.onpointerup = () => { seeking = false; };
      seek.oninput = () => { if (isFinite(audio.duration)) audio.currentTime = seek.value / 1000 * audio.duration; };
      vol.oninput = () => { audio.volume = vol.value / 100; audio.muted = false; };
      audio.volume = .8;

      const actions = {
        add: () => file.click(),
        clear: clearAll,
        play: () => { if (!audio.paused) audio.pause(); else play(); },
        stop, prev: () => { if (audio.currentTime > 3) audio.currentTime = 0; else step(-1); }, next: () => step(1),
        shuffle: e => { shuffle = !shuffle; e.classList.toggle("on", shuffle); },
        repeat: e => { repeat = !repeat; e.classList.toggle("on", repeat); },
        mute: e => { audio.muted = !audio.muted; e.classList.toggle("on", audio.muted); },
        rew: () => { audio.currentTime = Math.max(0, audio.currentTime - 10); },
        ffwd: () => { if (isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); },
        vprev: () => { vizMode = (vizMode + 2) % 3; showViz(); },
        vnext: () => { vizMode = (vizMode + 1) % 3; showViz(); }
      };
      root.addEventListener("click", e => {
        const b = e.target.closest("[data-do]");
        if (b && actions[b.dataset.do]) actions[b.dataset.do](b);
      });
      file.onchange = () => { addFiles(file.files); file.value = ""; };

      /* drag & drop */
      root.addEventListener("dragover", e => { e.preventDefault(); root.classList.add("drag"); });
      root.addEventListener("dragleave", e => { if (!root.contains(e.relatedTarget)) root.classList.remove("drag"); });
      root.addEventListener("drop", e => { e.preventDefault(); root.classList.remove("drag"); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

      /* menu bar: File / View / Play / Tools / Help */
      const mb = win.body.querySelector(".mb");
      const menus = {
        File: () => [{ label: "Open...", key: "Ctrl+O", action: () => file.click() }, "-", { label: "Clear playlist", disabled: !tracks.length, action: clearAll }, "-", { label: "Close", action: () => win.close() }],
        View: () => [{ label: "Visualization", items: ["Bars", "Waveform", "Circles"].map((n, i) => ({ label: n, checked: vizMode === i, action: () => { vizMode = i; showViz(); } })) }],
        Play: () => [{ label: audio.paused ? "Play" : "Pause", action: actions.play }, { label: "Stop", action: stop }, "-", { label: "Previous", action: actions.prev }, { label: "Next", action: actions.next }, "-", { label: "Shuffle", checked: shuffle, action: () => actions.shuffle($('[data-do="shuffle"]')) }, { label: "Repeat", checked: repeat, action: () => actions.repeat($('[data-do="repeat"]')) }],
        Tools: () => [{ label: "Options...", disabled: true }],
        Help: () => [{ label: "About Windows Media Player", disabled: true }]
      };
      mb.querySelectorAll("span").forEach(sp => sp.addEventListener("click", e => {
        e.stopPropagation();
        const f = menus[sp.textContent.trim()];
        if (f) XP.contextMenu.showAt(sp, f());
      }));
      $(".wm-nav .lib").onclick = () => file.click();
      cv.addEventListener("click", () => { vizMode = (vizMode + 1) % 3; showViz(); });
      showViz();
      root.tabIndex = 0;
      root.addEventListener("keydown", e => { if (e.code === "Space" && e.target === root) { e.preventDefault(); actions.play(); } });

      /* ---------- visualisation ---------- */
      function frame() {
        raf = requestAnimationFrame(frame);
        if (win.min || !win.el.isConnected) return;
        const w = cv.clientWidth, h = cv.clientHeight;
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        ctx2.clearRect(0, 0, w, h);
        const live = an && !audio.paused;
        if (live) { if (vizMode === 1) an.getByteTimeDomainData(data); else an.getByteFrequencyData(data); }
        const n = data ? data.length : 64, tt = performance.now() / 1000;
        const val = i => live ? data[i] / 255 : (.04 + .02 * Math.sin(tt * 2 + i));
        if (vizMode === 0) {
          const bars = 48, bw = w / bars;
          for (let i = 0; i < bars; i++) {
            const v = val(Math.floor(i / bars * n * .7)), bh = Math.max(2, v * h * .8);
            const g = ctx2.createLinearGradient(0, h, 0, h - bh); g.addColorStop(0, "#1a8a2a"); g.addColorStop(1, "#8cff6a");
            ctx2.fillStyle = g; ctx2.fillRect(i * bw + 1, h - bh, bw - 2, bh);
          }
        } else if (vizMode === 1) {
          ctx2.strokeStyle = "#7dff6a"; ctx2.lineWidth = 2; ctx2.beginPath();
          for (let i = 0; i < n; i++) {
            const x = i / (n - 1) * w, y = live ? data[i] / 255 * h : h / 2 + Math.sin(tt * 3 + i / 5) * 4;
            i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y);
          }
          ctx2.stroke();
        } else {
          const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .18;
          for (let i = 0; i < 64; i++) {
            const a = i / 64 * Math.PI * 2, v = val(Math.floor(i / 64 * n * .7)), r1 = R, r2 = R + v * Math.min(w, h) * .3 + 3;
            ctx2.strokeStyle = `hsl(${95 + v * 90},100%,${45 + v * 25}%)`; ctx2.lineWidth = 3;
            ctx2.beginPath(); ctx2.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx2.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx2.stroke();
          }
        }
      }
      frame();

      t.dispose = () => {
        cancelAnimationFrame(raf);
        audio.pause(); audio.removeAttribute("src"); audio.load();
        tracks.forEach(x => URL.revokeObjectURL(x.url)); tracks = [];
        if (ac) { try { ac.close(); } catch (e) {} ac = null; }
      };
      render();
    },

    /* closing the player throws the uploaded songs away (temporary files only) */
    onClose(win) { if (win.wmp) win.wmp.dispose(); }
  });
})();
