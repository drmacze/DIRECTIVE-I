(() => {
  const PENDING_KEY = 'directive_pending_profile';
  let pending = false;
  try { pending = sessionStorage.getItem(PENDING_KEY) === '1'; } catch (_) {}
  if (!pending) return;

  let profile = null;
  try { profile = JSON.parse(localStorage.getItem('directive_minecraft_profile') || 'null'); } catch (_) {}
  if (!profile?.authenticated) {
    try { sessionStorage.removeItem(PENDING_KEY); } catch (_) {}
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    :root{--auth-green:#70e224;--auth-line:rgba(255,255,255,.13);--auth-muted:#8f9992;--auth-ease:cubic-bezier(.16,1,.3,1)}
    .home-auth-overlay{position:fixed;inset:0;z-index:9400;display:grid;place-items:center;padding:max(20px,env(safe-area-inset-top)) 18px max(22px,env(safe-area-inset-bottom));background:rgba(2,5,4,.72);backdrop-filter:blur(18px) saturate(.82);-webkit-backdrop-filter:blur(18px) saturate(.82);opacity:0;transition:opacity .7s ease}
    .home-auth-overlay.is-ready{opacity:1}.home-auth-overlay.is-leaving{opacity:0;pointer-events:none}
    .home-auth-card{position:relative;width:min(670px,100%);max-height:min(820px,calc(100svh - 40px));overflow:auto;border:1px solid var(--auth-line);background:linear-gradient(145deg,rgba(11,16,13,.985),rgba(5,8,7,.985));box-shadow:0 40px 100px rgba(0,0,0,.46);padding:clamp(26px,6vw,48px);opacity:0;transform:translate3d(54px,0,0) scale(.985);filter:blur(10px);transition:opacity .9s ease,transform 1.05s var(--auth-ease),filter .9s ease}
    .home-auth-overlay.is-ready .home-auth-card{opacity:1;transform:none;filter:none}.home-auth-card.is-leaving{opacity:0;transform:translate3d(-44px,0,0) scale(.985);filter:blur(10px)}
    .home-auth-card:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:52px 52px;opacity:.32;pointer-events:none}.home-auth-layer{position:relative;z-index:1}
    .home-auth-brand{display:flex;align-items:baseline;font-size:30px;font-weight:950;letter-spacing:-.065em}.home-auth-brand span{color:#f4f6f4}.home-auth-brand b{color:var(--auth-green);margin-left:.16em}
    .home-auth-micro{margin-top:34px;display:flex;align-items:center;gap:9px;color:var(--auth-green);font-size:8px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;opacity:0;transform:translateY(10px);animation:homeAuthUp .8s .15s var(--auth-ease) forwards}.home-auth-micro i{width:7px;height:7px;border-radius:50%;background:var(--auth-green);box-shadow:0 0 16px rgba(112,226,36,.55)}
    .home-auth-title{margin:12px 0 0;font-size:clamp(40px,9vw,68px);line-height:.9;letter-spacing:-.065em;font-weight:950}.home-auth-title span{display:block;overflow:hidden}.home-auth-title span b{display:block;font-weight:950;transform:translateY(115%);opacity:0;animation:homeAuthText 1s var(--auth-ease) forwards}.home-auth-title span:nth-child(2) b{animation-delay:.1s}
    .home-identity-card{margin-top:26px;border:1px solid var(--auth-line);background:rgba(4,7,6,.62);overflow:hidden;opacity:0;transform:translateY(18px);animation:homeAuthUp .9s .28s var(--auth-ease) forwards}
    .home-identity-top{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;padding:20px;border-bottom:1px solid var(--auth-line)}.home-identity-avatar{width:68px;height:68px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(112,226,36,.34);background:#0b120d;color:var(--auth-green);font-weight:950}.home-identity-avatar img{width:100%;height:100%;object-fit:cover}.home-identity-name small{display:block;color:var(--auth-green);font-size:8px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.home-identity-name strong{display:block;margin-top:6px;font-size:clamp(23px,5vw,32px);letter-spacing:-.035em}.home-identity-name span{display:block;margin-top:5px;color:var(--auth-muted);font-size:11px}
    .home-identity-grid{display:grid;grid-template-columns:1fr 1fr}.home-identity-grid div{min-width:0;padding:15px 17px;border-right:1px solid var(--auth-line);border-bottom:1px solid var(--auth-line);opacity:0;transform:translateY(8px);animation:homeAuthUp .65s var(--auth-ease) forwards}.home-identity-grid div:nth-child(1){animation-delay:.52s}.home-identity-grid div:nth-child(2){animation-delay:.60s}.home-identity-grid div:nth-child(3){animation-delay:.68s}.home-identity-grid div:nth-child(4){animation-delay:.76s}.home-identity-grid div:nth-child(even){border-right:0}.home-identity-grid div:nth-last-child(-n+2){border-bottom:0}.home-identity-grid span,.home-identity-grid strong{display:block}.home-identity-grid span{color:#69736d;font-size:8px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}.home-identity-grid strong{margin-top:7px;color:#dfe4e0;font-size:11px;line-height:1.45;word-break:break-word}
    .home-auth-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;opacity:0;transform:translateY(10px);animation:homeAuthUp .8s .74s var(--auth-ease) forwards;transition:opacity .5s ease,transform .6s var(--auth-ease),max-height .6s var(--auth-ease),margin .6s var(--auth-ease);max-height:60px}.home-auth-actions.is-leaving{opacity:0;transform:translateY(8px);max-height:0;margin-top:0;pointer-events:none;overflow:hidden}
    .home-auth-button{min-height:46px;border:1px solid var(--auth-line);background:rgba(255,255,255,.018);color:#e3e8e4;font-size:9px;font-weight:950;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}.home-auth-button:active{transform:scale(.985)}.home-auth-button.accept{border-color:var(--auth-green);background:var(--auth-green);color:#071004}.home-auth-button.logout:hover,.home-auth-button.logout:focus-visible{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.04)}
    .home-auth-countdown{margin-top:0;opacity:0;transform:translateY(10px);max-height:0;overflow:hidden;transition:opacity .65s ease,transform .75s var(--auth-ease),max-height .75s var(--auth-ease),margin .75s var(--auth-ease)}.home-auth-countdown.is-active{margin-top:20px;opacity:1;transform:none;max-height:80px}.home-auth-countdown-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:10px;color:#89938d;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.home-auth-countdown-head strong{color:#e2e7e3;font:800 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace}.home-auth-countdown-track{height:3px;background:rgba(255,255,255,.08);overflow:hidden}.home-auth-countdown-bar{height:100%;width:100%;transform-origin:left;background:var(--auth-green);box-shadow:0 0 14px rgba(112,226,36,.3)}
    .home-auth-portal{position:fixed;inset:0;z-index:9700;pointer-events:none}.home-auth-portal i{position:absolute;display:block;background:#000;transition:transform .92s cubic-bezier(.7,0,.2,1)}.home-auth-portal .t{top:0;left:0;right:0;height:50%;transform:translateY(-101%)}.home-auth-portal .b{bottom:0;left:0;right:0;height:50%;transform:translateY(101%)}.home-auth-portal .l{left:0;top:0;bottom:0;width:50%;transform:translateX(-101%)}.home-auth-portal .r{right:0;top:0;bottom:0;width:50%;transform:translateX(101%)}.home-auth-portal.is-closing i{transform:translate(0,0)}.home-auth-portal.is-opening .t{transform:translateY(-101%)}.home-auth-portal.is-opening .b{transform:translateY(101%)}.home-auth-portal.is-opening .l{transform:translateX(-101%)}.home-auth-portal.is-opening .r{transform:translateX(101%)}
    @keyframes homeAuthText{to{transform:none;opacity:1}}@keyframes homeAuthUp{to{opacity:1;transform:none}}
    @media(max-width:620px){.home-auth-overlay{align-items:center;padding:18px 14px}.home-auth-card{padding:25px 21px;max-height:calc(100svh - 30px)}.home-auth-brand{font-size:26px}.home-auth-micro{margin-top:28px}.home-identity-top{grid-template-columns:58px 1fr;padding:17px}.home-identity-avatar{width:58px;height:58px}.home-identity-grid{grid-template-columns:1fr}.home-identity-grid div{border-right:0!important;border-bottom:1px solid var(--auth-line)!important}.home-identity-grid div:last-child{border-bottom:0!important}.home-auth-actions{gap:8px}.home-auth-button{min-height:44px}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'home-auth-overlay';
  overlay.innerHTML = `
    <section class="home-auth-card" role="dialog" aria-modal="true" aria-label="Verified Xbox profile">
      <div class="home-auth-layer">
        <div class="home-auth-brand"><span>DIRECTIVE</span><b>I</b></div>
        <div class="home-auth-micro"><i></i><span>Xbox identity verified</span></div>
        <h2 class="home-auth-title"><span><b>Access profile</b></span><span><b>confirmed.</b></span></h2>
        <article class="home-identity-card">
          <div class="home-identity-top">
            <div class="home-identity-avatar" data-home-auth-avatar>MC</div>
            <div class="home-identity-name"><small>Verified Minecraft identity</small><strong data-home-auth-gamertag></strong><span data-home-auth-display></span></div>
          </div>
          <div class="home-identity-grid">
            <div><span>Xbox user ID</span><strong data-home-auth-xuid></strong></div>
            <div><span>Gamerscore</span><strong data-home-auth-score></strong></div>
            <div><span>Provider</span><strong data-home-auth-provider></strong></div>
            <div><span>Session</span><strong>Authenticated</strong></div>
          </div>
        </article>
        <div class="home-auth-actions" data-home-auth-actions>
          <button class="home-auth-button logout" type="button" data-home-auth-logout>Log out</button>
          <button class="home-auth-button accept" type="button" data-home-auth-accept>Accept</button>
        </div>
        <div class="home-auth-countdown" data-home-auth-countdown-wrap>
          <div class="home-auth-countdown-head"><span>Entering DIRECTIVE I</span><strong data-home-auth-countdown>10.0s</strong></div>
          <div class="home-auth-countdown-track"><div class="home-auth-countdown-bar" data-home-auth-countdown-bar></div></div>
        </div>
      </div>
    </section>
    <div class="home-auth-portal" data-home-auth-portal aria-hidden="true"><i class="t"></i><i class="r"></i><i class="b"></i><i class="l"></i></div>`;
  document.body.appendChild(overlay);

  const card = overlay.querySelector('.home-auth-card');
  const actions = overlay.querySelector('[data-home-auth-actions]');
  const accept = overlay.querySelector('[data-home-auth-accept]');
  const logout = overlay.querySelector('[data-home-auth-logout]');
  const countdownWrap = overlay.querySelector('[data-home-auth-countdown-wrap]');
  const countdown = overlay.querySelector('[data-home-auth-countdown]');
  const countdownBar = overlay.querySelector('[data-home-auth-countdown-bar]');
  const portal = overlay.querySelector('[data-home-auth-portal]');
  let accepted = false;

  const text = (selector, value, fallback = '—') => {
    const el = overlay.querySelector(selector);
    if (el) el.textContent = value || fallback;
  };
  text('[data-home-auth-gamertag]', profile.gamertag, 'Minecraft player');
  text('[data-home-auth-display]', profile.displayName, 'Xbox profile');
  text('[data-home-auth-xuid]', profile.xuid);
  text('[data-home-auth-score]', profile.gamerscore || '0', '0');
  text('[data-home-auth-provider]', profile.provider, 'Microsoft / Xbox');

  const avatar = overlay.querySelector('[data-home-auth-avatar]');
  avatar.textContent = (profile.gamertag || 'MC').slice(0, 2).toUpperCase();
  if (profile.gamerpic) {
    const img = new Image();
    img.alt = `${profile.gamertag || 'Minecraft'} avatar`;
    img.referrerPolicy = 'no-referrer';
    img.onload = () => { avatar.textContent = ''; avatar.appendChild(img); };
    img.src = profile.gamerpic;
  }

  const previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-ready')));

  const clearAuth = () => {
    try {
      localStorage.removeItem('directive_minecraft_profile');
      localStorage.removeItem('directive_local_session');
      localStorage.removeItem('directive_onboarding_complete');
    } catch (_) {}
    try {
      ['directive_minecraft_account','directive_minecraft_gamertag','directive_minecraft_xuid','directive_home_entry','directive_pending_profile','directive_music_enabled','directive_music_should_play','directive_music_track','directive_music_title','directive_music_time','directive_music_saved_at'].forEach(k => sessionStorage.removeItem(k));
      sessionStorage.setItem('directive_logout_reveal', '1');
    } catch (_) {}
  };

  const closePanels = callback => {
    portal.classList.remove('is-opening');
    portal.classList.add('is-closing');
    setTimeout(callback, 940);
  };

  logout.addEventListener('click', () => {
    if (accepted) return;
    window.DIRECTIVE_MUSIC?.stopAndReset?.();
    card.classList.add('is-leaving');
    closePanels(() => {
      clearAuth();
      location.replace('welcome.html?logout=1&v=87');
    });
  });

  const finish = () => {
    card.classList.add('is-leaving');
    setTimeout(() => {
      closePanels(() => {
        try { sessionStorage.removeItem(PENDING_KEY); } catch (_) {}
        overlay.classList.add('is-leaving');
        document.documentElement.style.overflow = previousOverflow;
        setTimeout(() => {
          overlay.remove();
          portal.classList.remove('is-closing');
          portal.classList.add('is-opening');
          setTimeout(() => {
            window.DIRECTIVE_MUSIC?.reveal?.();
          }, 260);
          setTimeout(() => portal.remove(), 1000);
        }, 60);
      });
    }, 520);
  };

  const startCountdown = () => {
    countdownWrap.classList.add('is-active');
    const start = performance.now();
    const duration = 10000;
    const tick = now => {
      const elapsed = Math.min(duration, now - start);
      const remaining = Math.max(0, duration - elapsed);
      countdown.textContent = `${(remaining / 1000).toFixed(1)}s`;
      countdownBar.style.transform = `scaleX(${remaining / duration})`;
      if (elapsed < duration) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);
  };

  accept.addEventListener('click', () => {
    if (accepted) return;
    accepted = true;
    try {
      sessionStorage.setItem('directive_music_enabled', '1');
      sessionStorage.setItem('directive_music_should_play', '1');
      sessionStorage.setItem('directive_music_track', '0');
      sessionStorage.setItem('directive_music_time', '0');
      sessionStorage.setItem('directive_music_saved_at', String(Date.now()));
    } catch (_) {}

    window.DIRECTIVE_MUSIC?.acceptStart?.();
    actions.classList.add('is-leaving');
    setTimeout(() => {
      actions.style.display = 'none';
      startCountdown();
    }, 560);
  });
})();