/* js/apps/wmp.js - Windows Media Player using system/media/musictemp */
(function () {
  const IC = XP.icons.get;

  // Pre-defined tracks in your temporary folder
  // Add or edit track filenames here as you add audio files to system/media/musictemp/
  const DEFAULT_PLAYLIST = [
    { title: "Windows XP Startup", src: "system/media/Startup.mp3" },
    { title: "Sample Track 1", src: "system/media/musictemp/song1.mp3" },
    { title: "Sample Track 2", src: "system/media/musictemp/song2.mp3" }
  ];

  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  XP.apps.register({
    id: "wmp",
    title: "Windows Media Player",
    icon: "wmp",
    desktop: false, // Ensures NO icon appears on the desktop
    multi: false,
    size: { w: 500, h: 380 },

    content: function (win) {
      return `
        <style>
          .wmp-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #000;
            color: #fff;
            font-family: Tahoma, sans-serif;
            font-size: 11px;
            user-select: none;
          }
          .wmp-screen {
            flex: 1;
            background: radial-gradient(circle at center, #112244 0%, #000000 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-bottom: 2px solid #0055ea;
            position: relative;
            padding: 10px;
          }
          .wmp-viz {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #00aaff;
            box-shadow: 0 0 15px #00aaff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            background: #051020;
          }
          .wmp-track-info {
            font-weight: bold;
            font-size: 13px;
            color: #55ccff;
            text-align: center;
            text-shadow: 0 0 5px #0055aa;
          }
          .wmp-playlist {
            height: 110px;
            background: #111;
            overflow-y: auto;
            border-bottom: 1px solid #333;
          }
          .wmp-playlist-item {
            padding: 4px 8px;
            cursor: pointer;
            border-bottom: 1px solid #222;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .wmp-playlist-item:hover {
            background: #223355;
          }
          .wmp-playlist-item.active {
            background: #0055aa;
            color: #fff;
            font-weight: bold;
          }
          .wmp-controls {
            background: linear-gradient(to bottom, #2c2c2c 0%, #111111 100%);
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .wmp-seek-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .wmp-seek-bar {
            flex: 1;
            height: 5px;
            accent-color: #0088ff;
            cursor: pointer;
          }
          .wmp-buttons-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .wmp-btn-group {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .wmp-btn {
            background: linear-gradient(to bottom, #444, #111);
            border: 1px solid #666;
            color: #fff;
            padding: 3px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
          }
          .wmp-btn:hover {
            background: #0055aa;
            border-color: #0088ff;
          }
          .wmp-vol {
            width: 70px;
            accent-color: #0088ff;
          }
        </style>
        <div class="wmp-container">
          <div class="wmp-screen">
            <div class="wmp-viz">
              <img src="${IC("wmp")}" width="40" height="40" alt="WMP">
            </div>
            <div class="wmp-track-info" id="wmp-title-${win.key}">Select a Track</div>
          </div>

          <div class="wmp-playlist" id="wmp-playlist-${win.key}"></div>

          <div class="wmp-controls">
            <div class="wmp-seek-row">
              <span id="wmp-curr-${win.key}">00:00</span>
              <input type="range" class="wmp-seek-bar" id="wmp-seek-${win.key}" value="0" min="0" max="100" step="0.1">
              <span id="wmp-dur-${win.key}">00:00</span>
            </div>
            <div class="wmp-buttons-row">
              <div class="wmp-btn-group">
                <button class="wmp-btn" id="wmp-prev-${win.key}">⏮</button>
                <button class="wmp-btn" id="wmp-play-${win.key}">▶ Play</button>
                <button class="wmp-btn" id="wmp-stop-${win.key}">⏹ Stop</button>
                <button class="wmp-btn" id="wmp-next-${win.key}">⏭</button>
              </div>
              <div class="wmp-btn-group">
                <span>Vol:</span>
                <input type="range" class="wmp-vol" id="wmp-vol-${win.key}" min="0" max="1" step="0.05" value="0.8">
                <label class="wmp-btn" style="display:inline-block; margin-left:6px;">
                  Open...
                  <input type="file" id="wmp-file-${win.key}" accept="audio/*" style="display:none;">
                </label>
              </div>
            </div>
          </div>
          <audio id="wmp-audio-${win.key}"></audio>
        </div>
      `;
    },

    onOpen: function (win) {
      const key = win.key;
      const audio = win.body.querySelector(`#wmp-audio-${key}`);
      const btnPlay = win.body.querySelector(`#wmp-play-${key}`);
      const btnStop = win.body.querySelector(`#wmp-stop-${key}`);
      const btnPrev = win.body.querySelector(`#wmp-prev-${key}`);
      const btnNext = win.body.querySelector(`#wmp-next-${key}`);
      const seek = win.body.querySelector(`#wmp-seek-${key}`);
      const vol = win.body.querySelector(`#wmp-vol-${key}`);
      const titleEl = win.body.querySelector(`#wmp-title-${key}`);
      const currEl = win.body.querySelector(`#wmp-curr-${key}`);
      const durEl = win.body.querySelector(`#wmp-dur-${key}`);
      const playlistEl = win.body.querySelector(`#wmp-playlist-${key}`);
      const fileInput = win.body.querySelector(`#wmp-file-${key}`);

      let playlist = [...DEFAULT_PLAYLIST];
      let currentIndex = 0;

      function renderPlaylist() {
        playlistEl.innerHTML = "";
        playlist.forEach((track, idx) => {
          const item = document.createElement("div");
          item.className = "wmp-playlist-item" + (idx === currentIndex ? " active" : "");
          item.textContent = `${idx + 1}. ${track.title}`;
          item.addEventListener("click", () => {
            loadTrack(idx);
            playAudio();
          });
          playlistEl.appendChild(item);
        });
      }

      function loadTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        const track = playlist[currentIndex];
        audio.src = track.src;
        titleEl.textContent = track.title;
        renderPlaylist();
      }

      function playAudio() {
        if (!audio.src) return;
        audio.play().then(() => {
          btnPlay.textContent = "⏸ Pause";
        }).catch(err => console.warn("Playback error:", err));
      }

      function pauseAudio() {
        audio.pause();
        btnPlay.textContent = "▶ Play";
      }

      btnPlay.addEventListener("click", () => {
        if (audio.paused) {
          playAudio();
        } else {
          pauseAudio();
        }
      });

      btnStop.addEventListener("click", () => {
        audio.pause();
        audio.currentTime = 0;
        btnPlay.textContent = "▶ Play";
      });

      btnPrev.addEventListener("click", () => {
        const newIdx = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
        loadTrack(newIdx);
        playAudio();
      });

      btnNext.addEventListener("click", () => {
        const newIdx = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
        loadTrack(newIdx);
        playAudio();
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          seek.value = (audio.currentTime / audio.duration) * 100;
          currEl.textContent = formatTime(audio.currentTime);
          durEl.textContent = formatTime(audio.duration);
        }
      });

      seek.addEventListener("input", () => {
        if (audio.duration) {
          audio.currentTime = (seek.value / 100) * audio.duration;
        }
      });

      vol.addEventListener("input", () => {
        audio.volume = vol.value;
      });

      audio.addEventListener("ended", () => {
        const newIdx = (currentIndex + 1) % playlist.length;
        loadTrack(newIdx);
        playAudio();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const fileUrl = URL.createObjectURL(file);
          playlist.push({ title: file.name, src: fileUrl });
          loadTrack(playlist.length - 1);
          playAudio();
        }
      });

      // Initial setup
      audio.volume = parseFloat(vol.value);
      loadTrack(0);
    },

    onClose: function (win) {
      const audio = win.body.querySelector("audio");
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    }
  });
})();
