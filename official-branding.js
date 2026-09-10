(() => {
  const ASSETS = {
    microsoft: 'https://msftstories.thesourcemediaassets.com/sites/52/2015/01/MS-logo.jpg',
    xbox: 'https://xboxwire.thesourcemediaassets.com/sites/2/2026/05/Bootup_Wire-9c068aa206c9a72d2b1f.png',
    minecraft: 'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/logos/HEGD-24_Parallax-B_Logo_430x.svg'
  };

  const style = document.createElement('style');
  style.id = 'directive-official-branding-style';
  style.textContent = `
    .official-brand-strip{margin-top:16px;padding-top:13px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .official-brand-strip[data-compact="true"]{margin-top:12px;padding-top:11px;gap:8px}
    .official-brand-label{width:100%;color:rgba(220,228,222,.48);font-size:7px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    .official-brand-link{height:34px;min-width:58px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.025);text-decoration:none;overflow:hidden;transition:border-color .2s ease,background .2s ease,transform .2s ease}
    .official-brand-link:hover,.official-brand-link:focus-visible{border-color:rgba(112,226,36,.45);background:rgba(112,226,36,.055)}
    .official-brand-link:active{transform:scale(.98)}
    .official-brand-link.microsoft{width:108px;background:#fff;padding:0 8px}.official-brand-link.microsoft img{display:block;width:92px;height:auto}
    .official-brand-link.xbox{width:58px;background:#020303}.official-brand-link.xbox img{display:block;width:58px;height:33px;object-fit:cover}
    .official-brand-link.minecraft{width:116px;padding:5px 9px;background:rgba(255,255,255,.94)}.official-brand-link.minecraft img{display:block;max-width:96px;max-height:23px;width:100%;height:auto}
    .official-brand-note{margin-left:auto;color:rgba(222,230,224,.52);font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
    .site-footer .official-brand-strip{grid-column:1/-1;margin-top:2px;padding-top:14px}
    .player-profile-panel .official-brand-strip{margin-top:14px}
    .login-sheet .official-brand-strip{margin-top:15px}
    .lifecycle + .official-brand-strip{margin-top:20px}
    .home-identity-card .official-brand-strip{margin:0;padding:13px 16px;border-top:1px solid rgba(255,255,255,.1)}
    @media(max-width:620px){.official-brand-link{height:31px}.official-brand-link.microsoft{width:98px}.official-brand-link.microsoft img{width:82px}.official-brand-link.xbox{width:52px}.official-brand-link.xbox img{width:52px;height:30px}.official-brand-link.minecraft{width:104px}.official-brand-note{width:100%;margin-left:0;margin-top:2px}}
  `;
  document.head.appendChild(style);

  const makeStrip = (compact = false) => {
    const strip = document.createElement('div');
    strip.className = 'official-brand-strip';
    strip.dataset.compact = compact ? 'true' : 'false';
    strip.innerHTML = `
      <span class="official-brand-label">Identity & platform network</span>
      <a class="official-brand-link microsoft" href="https://www.microsoft.com/" target="_blank" rel="noopener noreferrer" aria-label="Microsoft official website"><img src="${ASSETS.microsoft}" alt="Microsoft" loading="lazy"></a>
      <a class="official-brand-link xbox" href="https://www.xbox.com/" target="_blank" rel="noopener noreferrer" aria-label="Xbox official website"><img src="${ASSETS.xbox}" alt="Xbox" loading="lazy"></a>
      <a class="official-brand-link minecraft" href="https://www.minecraft.net/" target="_blank" rel="noopener noreferrer" aria-label="Minecraft official website"><img src="${ASSETS.minecraft}" alt="Minecraft" loading="lazy"></a>
      <span class="official-brand-note">Unofficial fan project</span>`;
    return strip;
  };

  const install = () => {
    let changed = false;

    const loginWrap = document.querySelector('.minecraft-login-wrap');
    if (loginWrap && !loginWrap.querySelector('.official-brand-strip')) {
      loginWrap.appendChild(makeStrip(true));
      changed = true;
    }

    const lifecycle = document.querySelector('.lifecycle');
    if (lifecycle && !lifecycle.parentElement?.querySelector(':scope > .official-brand-strip')) {
      lifecycle.insertAdjacentElement('afterend', makeStrip(true));
      changed = true;
    }

    const homeIdentity = document.querySelector('.home-identity-card');
    if (homeIdentity && !homeIdentity.querySelector('.official-brand-strip')) {
      homeIdentity.appendChild(makeStrip(true));
      changed = true;
    }

    const profilePanel = document.querySelector('.player-profile-panel');
    if (profilePanel && !profilePanel.querySelector('.official-brand-strip')) {
      const logout = profilePanel.querySelector('[data-profile-logout],.player-profile-logout');
      const strip = makeStrip(true);
      if (logout) profilePanel.insertBefore(strip, logout);
      else profilePanel.appendChild(strip);
      changed = true;
    }

    const footerGrid = document.querySelector('.site-footer .footer-grid');
    if (footerGrid && !footerGrid.querySelector('.official-brand-strip')) {
      footerGrid.appendChild(makeStrip(false));
      changed = true;
    }

    return changed;
  };

  install();
  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 12000);
})();
