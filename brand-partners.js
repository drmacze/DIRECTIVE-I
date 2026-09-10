(() => {
  const SOURCES = {
    microsoft: 'https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg',
    xbox: 'https://education.minecraft.net/content/dam/education-edition/resources/images/edu-footer/MC-EDU_Footer-Image-0_Xbox-Game-Studios-Logo.svg',
    minecraft: 'https://education.minecraft.net/content/dam/education-edition/logos/Partner-with-Minecraft_Image-0_Minecraft-Logo_600x400.png'
  };

  const mark = (kind, label) => {
    const item = document.createElement('span');
    item.className = `directive-platform-mark directive-platform-mark--${kind}`;
    item.title = label;
    const img = document.createElement('img');
    img.src = SOURCES[kind];
    img.alt = `${label} official logo`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    item.appendChild(img);
    return item;
  };

  const build = (variant, { caption = true } = {}) => {
    const wrap = document.createElement('div');
    wrap.className = `directive-platform-strip directive-platform-strip--${variant}`;
    wrap.dataset.officialBrandStrip = variant;

    const label = document.createElement('span');
    label.className = 'directive-platform-label';
    label.textContent = variant === 'profile' ? 'Identity & platform' : 'Platform services';

    const marks = document.createElement('div');
    marks.className = 'directive-platform-marks';
    marks.append(mark('minecraft', 'Minecraft'), mark('xbox', 'Xbox Game Studios'), mark('microsoft', 'Microsoft'));

    wrap.append(label, marks);
    if (caption) {
      const note = document.createElement('span');
      note.className = 'directive-platform-caption';
      note.textContent = 'Unofficial fan project. Platform marks identify supported services only; no affiliation or endorsement is implied.';
      wrap.appendChild(note);
    }
    return wrap;
  };

  const installHero = () => {
    const meta = document.querySelector('.hero-meta');
    if (!meta || document.querySelector('[data-official-brand-strip="hero"]')) return;
    meta.insertAdjacentElement('afterend', build('hero', { caption: false }));
  };

  const installFooter = () => {
    const footer = document.querySelector('.site-footer .footer-grid');
    if (!footer || document.querySelector('[data-official-brand-strip="footer"]')) return;
    footer.appendChild(build('footer', { caption: true }));
  };

  const installProfile = () => {
    document.querySelectorAll('.player-profile-panel,.identity-card').forEach(panel => {
      if (panel.querySelector('[data-official-brand-strip="profile"]')) return;
      panel.appendChild(build('profile', { caption: false }));
    });
  };

  const installAll = () => { installHero(); installFooter(); installProfile(); };
  installAll();

  const observer = new MutationObserver(installProfile);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 20000);
})();
