(() => {
  const ASSETS = {
    microsoft: 'https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg',
    xbox: 'https://education.minecraft.net/content/dam/education-edition/resources/images/edu-footer/MC-EDU_Footer-Image-0_Xbox-Game-Studios-Logo.svg',
    minecraft: 'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/logos/HEGD-24_Parallax-B_Logo_430x.svg'
  };

  const style = document.createElement('style');
  style.id = 'directive-official-branding-style';
  style.textContent = `
    .official-brand-strip{margin-top:18px;padding-top:17px;border-top:1px solid rgba(255,255,255,.09);display:flex;align-items:center;gap:18px;flex-wrap:wrap;min-width:0}
    .official-brand-strip[data-compact="true"]{margin-top:15px;padding-top:14px;gap:14px}
    .official-brand-label{width:100%;color:rgba(220,228,222,.48);font-size:7px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    .official-brand-link{display:flex;align-items:center;justify-content:center;border:0!important;background:transparent!important;padding:0!important;margin:0;text-decoration:none;overflow:visible;line-height:0;box-shadow:none!important;outline-offset:7px;transition:opacity .2s ease,transform .22s cubic-bezier(.16,1,.3,1)}
    .official-brand-link:hover,.official-brand-link:focus-visible{background:transparent!important;opacity:.82;transform:translateY(-1px)}
    .official-brand-link:active{transform:scale(.98)}
    .official-brand-link img{display:block;width:auto;height:auto;object-fit:contain;background:transparent!important;border:0!important;box-shadow:none!important}
    .official-brand-link.microsoft img{width:126px;max-height:38px}
    .official-brand-link.xbox img{width:108px;max-height:46px}
    .official-brand-link.minecraft img{width:150px;max-height:48px}
    .official-brand-note{margin-left:auto;color:rgba(222,230,224,.46);font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
    .site-footer .official-brand-strip{grid-column:1/-1;margin-top:7px;padding-top:20px}
    .player-profile-panel .official-brand-strip{margin-top:16px}
    .login-sheet .official-brand-strip{margin-top:16px}
    .lifecycle + .official-brand-strip{margin-top:22px}
    .home-identity-card .official-brand-strip{margin:0;padding:16px;border-top:1px solid rgba(255,255,255,.09)}
    @media(max-width:620px){
      .official-brand-strip{gap:14px}.official-brand-strip[data-compact="true"]{gap:11px}
      .official-brand-link.microsoft img{width:102px;max-height:34px}
      .official-brand-link.xbox img{width:88px;max-height:38px}
      .official-brand-link.minecraft img{width:126px;max-height:40px}
      .official-brand-note{width:100%;margin-left:0;margin-top:2px}
      .site-footer .official-brand-strip{gap:16px;padding-top:18px}
    }
    @media(prefers-reduced-motion:reduce){.official-brand-link{transition:none}}
  `;
  document.head.appendChild(style);

  const makeStrip = (compact = false) => {
    const strip = document.createElement('div');
    strip.className = 'official-brand-strip';
    strip.dataset.compact = compact ? 'true' : 'false';
    strip.innerHTML = `
      <span class="official-brand-label">Identity & platform network</span>
      <a class="official-brand-link microsoft" href="https://www.microsoft.com/" target="_blank" rel="noopener noreferrer" aria-label="Microsoft official website"><img src="${ASSETS.microsoft}" alt="Microsoft" loading="lazy" decoding="async"></a>
      <a class="official-brand-link xbox" href="https://www.xbox.com/" target="_blank" rel="noopener noreferrer" aria-label="Xbox official website"><img src="${ASSETS.xbox}" alt="Xbox Game Studios" loading="lazy" decoding="async"></a>
      <a class="official-brand-link minecraft" href="https://www.minecraft.net/" target="_blank" rel="noopener noreferrer" aria-label="Minecraft official website"><img src="${ASSETS.minecraft}" alt="Minecraft" loading="lazy" decoding="async"></a>
      <span class="official-brand-note">Unofficial fan project</span>`;
    return strip;
  };

  const removeLegacyDuplicates = () => {
    document.querySelectorAll('.directive-platform-strip,[data-official-brand-strip]').forEach(node => node.remove());
  };

  const ensureSingle = (host, compact, before = null) => {
    if (!host) return null;
    const existing = Array.from(host.children).filter(el => el.classList?.contains('official-brand-strip'));
    const strip = existing.shift() || makeStrip(compact);
    existing.forEach(el => el.remove());
    if (!strip.parentElement) host.appendChild(strip);
    if (before && before.parentElement === host && strip.previousElementSibling !== before) before.insertAdjacentElement('afterend', strip);
    return strip;
  };

  const install = () => {
    removeLegacyDuplicates();

    const loginWrap = document.querySelector('.minecraft-login-wrap');
    if (loginWrap) ensureSingle(loginWrap, true);

    const lifecycle = document.querySelector('.lifecycle');
    if (lifecycle && lifecycle.parentElement) {
      const host = lifecycle.parentElement;
      let strip = Array.from(host.children).find(el => el.classList?.contains('official-brand-strip'));
      if (!strip) {
        strip = makeStrip(true);
        lifecycle.insertAdjacentElement('afterend', strip);
      }
    }

    const homeIdentity = document.querySelector('.home-identity-card');
    if (homeIdentity) ensureSingle(homeIdentity, true);

    const profilePanel = document.querySelector('.player-profile-panel');
    if (profilePanel) {
      const logout = profilePanel.querySelector('[data-profile-logout],.player-profile-logout');
      let strip = Array.from(profilePanel.children).find(el => el.classList?.contains('official-brand-strip'));
      if (!strip) strip = makeStrip(true);
      if (!strip.parentElement) {
        if (logout) profilePanel.insertBefore(strip, logout);
        else profilePanel.appendChild(strip);
      }
    }

    const footerGrid = document.querySelector('.site-footer .footer-grid');
    if (footerGrid) {
      const cookie = footerGrid.querySelector('[data-cookie-settings],.cookie-settings-trigger');
      ensureSingle(footerGrid, false, cookie || null);
    }
  };

  install();
  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 20000);
})();
