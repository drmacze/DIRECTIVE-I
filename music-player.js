(() => {
  const TRACKS = [
    {
      id: 'worry',
      title: 'Worry',
      src: 'assets/audio/worry.mp3?v=1',
      cover: 'assets/music/worry-cover.jpg?v=1',
      alt: 'Worry cover'
    },
    {
      id: 'directive-s1',
      title: 'Directive I - S1',
      src: 'assets/audio/directive-i-s1.mp3?v=1',
      cover: 'https://res.cloudinary.com/vitjnhhb/image/upload/v1788986703/directive-i-season-1-cover.jpg',
      alt: 'DIRECTIVE I Season I cover'
    }
  ];

  const enabled = (() => {
    try { return sessionStorage.getItem('directive_music_enabled') === '1'; }
    catch (_) { return false; }
  })();
  if (!enabled) return;

  const readIndex = () => {
    try {
      const raw = Number(sessionStorage.getItem('directive_music_track') || 0);
      return Number.isInteger(raw) && raw >= 0 && raw < TRACKS.length ? raw : 0;
    } catch (_) { return 0; }
  };

  const style = document.createElement('style');
  style.textContent = `
    :root{--directive-music-green:#70e224}
    .directive-music-wrap{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:6800;display:flex;align-items:flex-end;gap:8px;pointer-events:none;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .directive-music-player{width:min(350px,calc(100vw - 82px));min-height:92px;display:grid;grid-template-columns:66px minmax(0,1fr) 38px;gap:13px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(9,13,11,.96),rgba(4,7,6,.94));backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 24px 64px rgba(0,0,0,.42);opacity:0;transform:translate3d(122%,0,0);filter:blur(5px);transition:transform 1.02s cubic-bezier(.16,1,.3,1),opacity .62s ease,filter .72s ease;pointer-events:none;will-change:transform,opacity,filter;overflow:hidden}
    .directive-music-player:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 48%,rgba(112,226,36,.035) 55%,transparent 62%);pointer-events:none}
    .directive-music-wrap.is-open .directive-music-player{opacity:1;transform:none;filter:none;pointer-events:auto}
    .directive-music-player.is-switching{opacity:0!important;transform:translate3d(-18px,0,0)!important;filter:blur(7px)!important;transition-duration:.34s!important}
    .directive-music-cover{width:66px;height:66px;object-fit:cover;display:block;border:1px solid rgba(255,255,255,.13);background:#070a08;transition:opacity .28s ease,transform .45s cubic-bezier(.16,1,.3,1)}
    .directive-music-copy{min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center}.directive-music-kicker{color:var(--directive-music-green);font-size:7px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.directive-music-title{margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f6f4;font-size:13px;font-weight:850;letter-spacing:-.01em;transition:opacity .25s ease,transform .4s cubic-bezier(.16,1,.3,1)}.directive-music-wave{display:block;width:100%;height:26px;margin-top:8px}
    .directive-music-control{width:36px;height:36px;border:1px solid rgba(112,226,36,.38);background:rgba(112,226,36,.06);color:#f6f8f6;display:grid;place-items:center;cursor:pointer;transition:background .18s ease,border-color .18s ease,transform .18s ease}.directive-music-control:hover,.directive-music-control:focus-visible{border-color:var(--directive-music-green);background:rgba(112,226,36,.12)}.directive-music-control:active{transform:scale(.94)}.directive-music-control span{font-size:12px;line-height:1}
    .directive-music-tab{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.14);background:rgba(5,8,7,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#fff;cursor:pointer;pointer-events:auto;box-shadow:0 12px 34px rgba(0,0,0,.32);transition:border-color .18s ease,background .18s ease,transform .35s cubic-bezier(.16,1,.3,1)}.directive-music-tab:hover,.directive-music-tab:focus-visible{border-color:rgba(112,226,36,.55);background:rgba(9,14,11,.98)}.directive-music-tab:active{transform:scale(.94)}
    .directive-tab-bars{width:18px;height:16px;display:flex;align-items:flex-end;justify-content:center;gap:2px}.directive-tab-bars i{width:2px;min-height:3px;background:#fff;animation:directiveTabWave 1s ease-in-out infinite}.directive-tab-bars i:nth-child(2){animation-delay:-.3s;background:var(--directive-music-green)}.directive-tab-bars i:nth-child(3){animation-delay:-.55s}.directive-tab-bars i:nth-child(4){animation-delay:-.72s;background:var(--directive-music-green)}@keyframes directiveTabWave{0%,100%{height:4px;opacity:.65}50%{height:15px;opacity:1}}
    .directive-music-wrap.is-paused .directive-tab-bars i{animation-play-state:paused;height:4px!important}.directive-music-wrap.is-paused .directive-music-kicker{color:#9aa39d}
    @media(max-width:620px){.directive-music-wrap{right:max(12px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))}.directive-music-player{width:min(306px,calc(100vw - 66px));grid-template-columns:56px minmax(0,1fr) 34px;gap:10px;padding:10px;min-height:78px}.directive-music-cover{width:56px;height:56px}.directive-music-control{width:32px;height:32px}.directive-music-tab{width:40px;height:40px}.directive-music-title{font-size:12px}.directive-music-wave{height:22px}}
    @media(prefers-reduced-motion:reduce){.directive-music-player{transition-duration:.01ms}.directive-tab-bars i{animation:none;height:7px}}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('aside');
  wrap.className = 'directive-music-wrap is-paused';
  wrap.setAttribute('aria-label', 'DIRECTIVE I music player');
  wrap.innerHTML = `
    <div class="directive-music-player" data-music-panel>
      <img class="directive-music-cover" data-music-cover alt="" />
      <div class="directive-music-copy">
        <span class="directive-music-kicker" data-music-state>Now playing</span>
        <strong class="directive-music-title" data-music-title></strong>
        <canvas class="directive-music-wave" width="220" height="42" data-music-wave aria-hidden="true"></canvas>
      </div>
      <button class="directive-music-control" type="button" data-music-toggle aria-label="Play music"><span>▶</span></button>
    </div>
    <button class="directive-music-tab" type="button" data-music-open aria-label="Open music player">
      <span class="directive-tab-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    </button>`;
  document.body.appendChild(wrap);

  const panel = wrap.querySelector('[data-music-panel]');
  const cover = wrap.querySelector('[data-music-cover]');
  const title = wrap.querySelector('[data-music-title]');
  const openButton = wrap.querySelector('[data-music-open]');
  const toggle = wrap.querySelector('[data-music-toggle]');
  const toggleIcon = toggle.querySelector('span');
  const stateLabel = wrap.querySelector('[data-music-state]');
  const canvas = wrap.querySelector('[data-music-wave]');
  const ctx = canvas.getContext('2d');

  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = false;
  audio.volume = .72;

  let trackIndex = readIndex();
  let hideTimer = 0;
  let analyser = null;
  let data = null;
  let audioContext = null;
  let sourceMade = false;
  let zeroFrames = 0;
  let switching = false;

  const track = () => TRACKS[trackIndex];
  const writeTrackVisuals = () => {
    const item = track();
    cover.src = item.cover;
    cover.alt = item.alt;
    title.textContent = item.title;
    document.documentElement.dataset.directiveTrack = item.id;
  };

  const persist = () => {
    try {
      sessionStorage.setItem('directive_music_track', String(trackIndex));
      sessionStorage.setItem('directive_music_time', String(Number.isFinite(audio.currentTime) ? audio.currentTime : 0));
      sessionStorage.setItem('directive_music_saved_at', String(Date.now()));
      sessionStorage.setItem('directive_music_should_play', audio.paused ? '0' : '1');
      sessionStorage.setItem('directive_music_title', track().title);
    } catch (_) {}
  };

  const sync = () => {
    const paused = audio.paused;
    wrap.classList.toggle('is-paused', paused);
    toggleIcon.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play music' : 'Pause music');
    stateLabel.textContent = paused ? 'Paused' : 'Now playing';
  };

  const open = (autoHide = true) => {
    wrap.classList.add('is-open');
    clearTimeout(hideTimer);
    if (autoHide) hideTimer = setTimeout(() => wrap.classList.remove('is-open'), 7000);
  };
  const closeLater = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => wrap.classList.remove('is-open'), 7000);
  };

  const ensureAnalyser = async () => {
    if (sourceMade) {
      try { await audioContext?.resume(); } catch (_) {}
      return;
    }
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = .74;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      data = new Uint8Array(analyser.frequencyBinCount);
      sourceMade = true;
      await audioContext.resume();
    } catch (_) {
      analyser = null;
      data = null;
    }
  };

  const setTrack = (index, { announce = false, autoplay = false, resetTime = true } = {}) => {
    if (switching) return;
    switching = true;
    trackIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const commit = () => {
      const item = track();
      audio.src = item.src;
      if (resetTime) {
        try { audio.currentTime = 0; } catch (_) {}
      }
      writeTrackVisuals();
      try {
        sessionStorage.setItem('directive_music_track', String(trackIndex));
        sessionStorage.setItem('directive_music_time', '0');
        sessionStorage.setItem('directive_music_title', item.title);
      } catch (_) {}
      panel.classList.remove('is-switching');
      switching = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (announce) open(true);
        if (autoplay) audio.play().then(ensureAnalyser).catch(() => sync());
        sync();
      }));
    };
    if (announce) {
      wrap.classList.remove('is-open');
      panel.classList.add('is-switching');
      setTimeout(commit, 360);
    } else {
      commit();
    }
  };

  const draw = t => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0, 0, w, h);
    let values = [];
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      if (sum < 8) zeroFrames++; else zeroFrames = 0;
      values = Array.from({ length: 19 }, (_, i) => data[Math.min(data.length - 1, Math.floor(i * data.length / 19))] || 0);
    }
    if (!values.length || zeroFrames > 90) {
      values = Array.from({ length: 19 }, (_, i) => audio.paused ? 20 : 48 + 68 * (.5 + .5 * Math.sin(t / 215 + i * .76)) * (.55 + .45 * Math.sin(t / 480 + i * .29)));
    }
    const gap = 3 * dpr;
    const bw = Math.max(2 * dpr, (w - gap * (values.length - 1)) / values.length);
    values.forEach((v, i) => {
      const norm = Math.max(.08, Math.min(1, v / 190));
      const bh = Math.max(2 * dpr, norm * h * .94);
      const x = i * (bw + gap);
      const y = (h - bh) / 2;
      const high = v > 118;
      ctx.fillStyle = high ? '#70e224' : 'rgba(255,255,255,.9)';
      if (v > 150) {
        ctx.shadowColor = 'rgba(112,226,36,.62)';
        ctx.shadowBlur = 8 * dpr;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, bw, bh);
    });
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);

  openButton.addEventListener('click', () => {
    open(true);
    if (!audio.paused) ensureAnalyser();
  });
  toggle.addEventListener('click', async () => {
    clearTimeout(hideTimer);
    if (audio.paused) {
      await ensureAnalyser();
      audio.play().catch(() => {});
      try { sessionStorage.setItem('directive_music_should_play', '1'); } catch (_) {}
    } else {
      audio.pause();
      try { sessionStorage.setItem('directive_music_should_play', '0'); } catch (_) {}
    }
    sync();
    closeLater();
  });
  ['pointerdown', 'focusin', 'mouseenter'].forEach(evt => panel.addEventListener(evt, () => clearTimeout(hideTimer)));
  ['pointerup', 'focusout', 'mouseleave'].forEach(evt => panel.addEventListener(evt, closeLater));

  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('timeupdate', persist);
  audio.addEventListener('ended', () => {
    const next = (trackIndex + 1) % TRACKS.length;
    try {
      sessionStorage.setItem('directive_music_should_play', '1');
      sessionStorage.setItem('directive_music_time', '0');
    } catch (_) {}
    setTrack(next, { announce: true, autoplay: true, resetTime: true });
  });
  audio.addEventListener('error', () => {
    stateLabel.textContent = 'Track unavailable';
    wrap.classList.add('is-paused');
  });

  const restore = () => {
    let time = 0;
    let savedAt = 0;
    let shouldPlay = false;
    try {
      time = Number(sessionStorage.getItem('directive_music_time') || 0) || 0;
      savedAt = Number(sessionStorage.getItem('directive_music_saved_at') || 0) || 0;
      shouldPlay = sessionStorage.getItem('directive_music_should_play') === '1';
    } catch (_) {}

    trackIndex = readIndex();
    writeTrackVisuals();
    audio.src = track().src;
    const elapsed = shouldPlay && savedAt ? Math.min(4, Math.max(0, (Date.now() - savedAt) / 1000)) : 0;
    const seekAndPlay = () => {
      const target = Math.max(0, time + elapsed);
      try {
        if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Math.min(target, Math.max(0, audio.duration - .08));
        else if (target > 0) audio.currentTime = target;
      } catch (_) {}
      if (shouldPlay) audio.play().then(ensureAnalyser).catch(() => sync());
      sync();
    };
    if (audio.readyState >= 1) seekAndPlay();
    else audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
  };

  restore();
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

  const params = new URLSearchParams(location.search);
  const enteredFromAuth = params.get('music') === '1' || params.get('auth') === 'success';
  setTimeout(() => {
    open(true);
    if (enteredFromAuth && history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
  }, enteredFromAuth ? 1900 : 850);
})();