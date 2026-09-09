(() => {
  const PROFILE_KEY = 'directive_minecraft_profile';
  const LOGOUT_REVEAL_KEY = 'directive_logout_reveal';

  function installStyles() {
    if (document.getElementById('directive-profile-logout-style')) return;
    const style = document.createElement('style');
    style.id = 'directive-profile-logout-style';
    style.textContent = `
      .player-profile-logout{margin-top:15px;width:100%;min-height:42px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 13px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.025);color:#e7ece8;cursor:pointer;font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;transition:border-color .18s ease,background .18s ease,color .18s ease,transform .18s ease}
      .player-profile-logout:hover,.player-profile-logout:focus-visible{border-color:rgba(112,226,36,.55);background:rgba(112,226,36,.08);color:#fff}
      .player-profile-logout:active{transform:scale(.985)}
      .player-profile-logout span:last-child{color:#70e224;font-size:14px;line-height:1}
      .profile-logout-transition{position:fixed;inset:0;z-index:10000;pointer-events:none}
      .profile-logout-transition i{position:absolute;display:block;background:#000;transition:transform .9s cubic-bezier(.7,0,.2,1);will-change:transform}
      .profile-logout-transition .logout-top{top:0;left:0;right:0;height:50%;transform:translateY(-101%)}
      .profile-logout-transition .logout-bottom{bottom:0;left:0;right:0;height:50%;transform:translateY(101%)}
      .profile-logout-transition .logout-left{left:0;top:0;bottom:0;width:50%;transform:translateX(-101%)}
      .profile-logout-transition .logout-right{right:0;top:0;bottom:0;width:50%;transform:translateX(101%)}
      .profile-logout-transition.is-closing i{transform:translate(0,0)}
      @media(prefers-reduced-motion:reduce){.profile-logout-transition i{transition-duration:.01ms}}
    `;
    document.head.appendChild(style);
  }

  function clearDirectiveSession() {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('directive_local_session');
      localStorage.removeItem('directive_onboarding_complete');
    } catch (_) {}

    try {
      sessionStorage.removeItem('directive_minecraft_gamertag');
      sessionStorage.removeItem('directive_minecraft_xuid');
      sessionStorage.removeItem('directive_minecraft_account');
      sessionStorage.removeItem('directive_home_entry');
      sessionStorage.removeItem('directive_microsoft_oauth_state');
      sessionStorage.setItem(LOGOUT_REVEAL_KEY, '1');
    } catch (_) {}
  }

  function runLogout() {
    if (document.querySelector('.profile-logout-transition')) return;

    const overlay = document.createElement('div');
    overlay.className = 'profile-logout-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<i class="logout-top"></i><i class="logout-right"></i><i class="logout-bottom"></i><i class="logout-left"></i>';
    document.body.appendChild(overlay);

    document.body.style.pointerEvents = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-closing')));

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      clearDirectiveSession();
      window.location.replace('welcome.html?logout=1&v=58');
    }, reduced ? 30 : 920);
  }

  function attachLogout() {
    const panel = document.querySelector('.player-profile-panel');
    if (!panel || panel.querySelector('[data-profile-logout]')) return false;

    installStyles();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'player-profile-logout';
    button.dataset.profileLogout = '';
    button.innerHTML = '<span>Log out</span><span aria-hidden="true">→</span>';
    button.addEventListener('click', runLogout);
    panel.appendChild(button);
    return true;
  }

  if (attachLogout()) return;

  const observer = new MutationObserver(() => {
    if (attachLogout()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 6000);
})();
