(() => {
  const MUSIC_SRC = 'https://drive.usercontent.google.com/download?id=1N96znfLcoSaPY-S0xVPlMO1V95fvxHK6&export=download&confirm=t';
  const COVER_SRC = 'https://res.cloudinary.com/vitjnhhb/image/upload/v1788986703/directive-i-season-1-cover.jpg';
  const TITLE = 'Directive I - S1';
  const enabled = (() => { try { return sessionStorage.getItem('directive_music_enabled') === '1'; } catch (_) { return false; } })();
  if (!enabled) return;

  const style = document.createElement('style');
  style.textContent = `
    :root{--directive-music-green:#70e224}
    .directive-music-wrap{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:6800;display:flex;align-items:flex-end;gap:8px;pointer-events:none;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .directive-music-player{width:min(340px,calc(100vw - 82px));min-height:88px;display:grid;grid-template-columns:64px minmax(0,1fr) 38px;gap:12px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.14);background:rgba(5,8,7,.92);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:0 22px 55px rgba(0,0,0,.38);opacity:0;transform:translate3d(118%,0,0);filter:blur(4px);transition:transform .72s cubic-bezier(.16,1,.3,1),opacity .4s ease,filter .5s ease;pointer-events:none;will-change:transform,opacity}
    .directive-music-wrap.is-open .directive-music-player{opacity:1;transform:none;filter:none;pointer-events:auto}
    .directive-music-cover{width:64px;height:64px;object-fit:cover;display:block;border:1px solid rgba(255,255,255,.12);background:#070a08}
    .directive-music-copy{min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center}.directive-music-kicker{color:var(--directive-music-green);font-size:7px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.directive-music-title{margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f6f4;font-size:13px;font-weight:850;letter-spacing:-.01em}.directive-music-wave{display:block;width:100%;height:25px;margin-top:8px}
    .directive-music-control{width:36px;height:36px;border:1px solid rgba(112,226,36,.38);background:rgba(112,226,36,.06);color:#f6f8f6;display:grid;place-items:center;cursor:pointer;transition:background .18s ease,border-color .18s ease,transform .18s ease}.directive-music-control:hover,.directive-music-control:focus-visible{border-color:var(--directive-music-green);background:rgba(112,226,36,.12)}.directive-music-control:active{transform:scale(.94)}.directive-music-control span{font-size:12px;line-height:1}
    .directive-music-tab{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.14);background:rgba(5,8,7,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#fff;cursor:pointer;pointer-events:auto;box-shadow:0 12px 34px rgba(0,0,0,.32);transition:border-color .18s ease,background .18s ease,transform .3s cubic-bezier(.16,1,.3,1)}.directive-music-tab:hover,.directive-music-tab:focus-visible{border-color:rgba(112,226,36,.55);background:rgba(9,14,11,.98)}.directive-music-tab:active{transform:scale(.94)}
    .directive-tab-bars{width:18px;height:16px;display:flex;align-items:flex-end;justify-content:center;gap:2px}.directive-tab-bars i{width:2px;min-height:3px;background:#fff;animation:directiveTabWave 1s ease-in-out infinite}.directive-tab-bars i:nth-child(2){animation-delay:-.3s;background:var(--directive-music-green)}.directive-tab-bars i:nth-child(3){animation-delay:-.55s}.directive-tab-bars i:nth-child(4){animation-delay:-.72s;background:var(--directive-music-green)}@keyframes directiveTabWave{0%,100%{height:4px;opacity:.65}50%{height:15px;opacity:1}}
    .directive-music-wrap.is-paused .directive-tab-bars i{animation-play-state:paused;height:4px!important}.directive-music-wrap.is-paused .directive-music-kicker{color:#9aa39d}
    @media(max-width:620px){.directive-music-wrap{right:max(12px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))}.directive-music-player{width:min(300px,calc(100vw - 66px));grid-template-columns:54px minmax(0,1fr) 34px;gap:10px;padding:9px;min-height:74px}.directive-music-cover{width:54px;height:54px}.directive-music-control{width:32px;height:32px}.directive-music-tab{width:40px;height:40px}.directive-music-title{font-size:12px}.directive-music-wave{height:21px}}
    @media(prefers-reduced-motion:reduce){.directive-music-player{transition-duration:.01ms}.directive-tab-bars i{animation:none;height:7px}}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('aside');
  wrap.className = 'directive-music-wrap is-paused';
  wrap.setAttribute('aria-label', 'DIRECTIVE I music player');
  wrap.innerHTML = `
    <div class="directive-music-player" data-music-panel>
      <img class="directive-music-cover" src="${COVER_SRC}" alt="DIRECTIVE I Season I cover" />
      <div class="directive-music-copy"><span class="directive-music-kicker" data-music-state>Season I soundtrack</span><strong class="directive-music-title">${TITLE}</strong><canvas class="directive-music-wave" width="210" height="40" data-music-wave aria-hidden="true"></canvas></div>
      <button class="directive-music-control" type="button" data-music-toggle aria-label="Play music"><span>▶</span></button>
    </div>
    <button class="directive-music-tab" type="button" data-music-open aria-label="Open music player"><span class="directive-tab-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
  document.body.appendChild(wrap);

  const audio = new Audio(MUSIC_SRC);
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = .72;
  const panel = wrap.querySelector('[data-music-panel]');
  const openButton = wrap.querySelector('[data-music-open]');
  const toggle = wrap.querySelector('[data-music-toggle]');
  const toggleIcon = toggle.querySelector('span');
  const stateLabel = wrap.querySelector('[data-music-state]');
  const canvas = wrap.querySelector('[data-music-wave]');
  const ctx = canvas.getContext('2d');
  let hideTimer = 0;
  let analyser = null;
  let data = null;
  let audioContext = null;
  let sourceMade = false;
  let zeroFrames = 0;

  const persist = () => { try { sessionStorage.setItem('directive_music_time', String(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)); sessionStorage.setItem('directive_music_saved_at', String(Date.now())); sessionStorage.setItem('directive_music_should_play', audio.paused ? '0' : '1'); } catch (_) {} };
  const sync = () => { const paused = audio.paused; wrap.classList.toggle('is-paused', paused); toggleIcon.textContent = paused ? '▶' : 'Ⅱ'; toggle.setAttribute('aria-label', paused ? 'Play music' : 'Pause music'); stateLabel.textContent = paused ? 'Season I soundtrack · paused' : 'Season I soundtrack · playing'; };
  const open = (autoHide = true) => { wrap.classList.add('is-open'); clearTimeout(hideTimer); if (autoHide) hideTimer = setTimeout(() => wrap.classList.remove('is-open'), 5600); };
  const closeLater = () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => wrap.classList.remove('is-open'), 5600); };

  const ensureAnalyser = async () => {
    if (sourceMade) { try { await audioContext?.resume(); } catch (_) {} return; }
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      analyser = audioContext.createAnalyser(); analyser.fftSize = 64; analyser.smoothingTimeConstant = .72;
      source.connect(analyser); analyser.connect(audioContext.destination); data = new Uint8Array(analyser.frequencyBinCount); sourceMade = true;
      await audioContext.resume();
    } catch (_) { analyser = null; data = null; }
  };

  const draw = t => {
    const dpr = Math.min(2, window.devicePixelRatio || 1), rect = canvas.getBoundingClientRect(), w = Math.max(1, Math.floor(rect.width * dpr)), h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0,0,w,h);
    let values = [];
    if (analyser && data) { analyser.getByteFrequencyData(data); let sum=0; for (let i=0;i<data.length;i++) sum+=data[i]; if (sum < 8) zeroFrames++; else zeroFrames=0; values = Array.from({length:18},(_,i)=>data[Math.min(data.length-1,Math.floor(i*data.length/18))]||0); }
    if (!values.length || zeroFrames > 90) values = Array.from({length:18},(_,i)=> audio.paused ? 22 : 52 + 58*(.5+.5*Math.sin(t/230+i*.78))* (.55+.45*Math.sin(t/510+i*.31)));
    const gap = 3*dpr, bw = Math.max(2*dpr,(w-gap*(values.length-1))/values.length);
    values.forEach((v,i)=>{const norm=Math.max(.09,Math.min(1,v/190)),bh=Math.max(2*dpr,norm*h*.92),x=i*(bw+gap),y=(h-bh)/2;ctx.fillStyle=v>118?'#70e224':'rgba(255,255,255,.88)';if(v>150){ctx.shadowColor='rgba(112,226,36,.58)';ctx.shadowBlur=7*dpr}else ctx.shadowBlur=0;ctx.fillRect(x,y,bw,bh)});ctx.shadowBlur=0;requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);

  openButton.addEventListener('click', () => { open(true); if (!audio.paused) ensureAnalyser(); });
  toggle.addEventListener('click', async () => { clearTimeout(hideTimer); if (audio.paused) { await ensureAnalyser(); audio.play().catch(()=>{}); try { sessionStorage.setItem('directive_music_should_play','1'); } catch (_) {} } else { audio.pause(); try { sessionStorage.setItem('directive_music_should_play','0'); } catch (_) {} } sync(); closeLater(); });
  ['pointerdown','focusin','mouseenter'].forEach(evt=>panel.addEventListener(evt,()=>{clearTimeout(hideTimer)}));
  ['pointerup','focusout','mouseleave'].forEach(evt=>panel.addEventListener(evt,closeLater));
  audio.addEventListener('play',sync); audio.addEventListener('pause',sync); audio.addEventListener('timeupdate',persist); audio.addEventListener('error',()=>{stateLabel.textContent='Season I soundtrack · source unavailable';wrap.classList.add('is-paused')});

  const restore = () => {
    let time=0, savedAt=0, shouldPlay=false;
    try { time = Number(sessionStorage.getItem('directive_music_time')||0)||0; savedAt=Number(sessionStorage.getItem('directive_music_saved_at')||0)||0; shouldPlay=sessionStorage.getItem('directive_music_should_play')==='1'; } catch (_) {}
    const elapsed = shouldPlay && savedAt ? Math.min(4,(Date.now()-savedAt)/1000) : 0;
    const seek = () => { try { if (time+elapsed>0) audio.currentTime=time+elapsed; } catch (_) {} if (shouldPlay) audio.play().then(ensureAnalyser).catch(()=>sync()); sync(); };
    if (audio.readyState>=1) seek(); else audio.addEventListener('loadedmetadata',seek,{once:true});
  };
  restore();
  window.addEventListener('pagehide',persist);

  const homeEntry = (()=>{try{return sessionStorage.getItem('directive_home_entry')==='1'}catch(_){return false}})();
  setTimeout(()=>open(true), homeEntry ? 1450 : 700);
})();