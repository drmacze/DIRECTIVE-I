const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const modal = document.querySelector('[data-trailer-modal]');
const modalVideo = document.querySelector('[data-modal-video]');
const heroVideo = document.querySelector('[data-hero-video]');
const heroDescription = document.querySelector('.hero-description');
const trailerPreview = document.querySelector('[data-trailer-preview]');
const openTrailerButtons = document.querySelectorAll('[data-open-trailer]');
const closeTrailerButton = document.querySelector('[data-close-trailer]');

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('is-open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileMenu?.classList.toggle('is-open', !open);
  mobileMenu?.setAttribute('aria-hidden', String(open));
  document.body.classList.toggle('menu-open', !open);
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

function initHeroTyping() {
  if (!heroDescription) return;

  const fullText = heroDescription.textContent.trim();
  if (!fullText) return;

  heroDescription.setAttribute('aria-label', fullText);
  heroDescription.setAttribute('aria-live', 'off');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroDescription.textContent = fullText;
    return;
  }

  heroDescription.textContent = '';
  heroDescription.classList.add('is-typing');

  let index = 0;

  const typeNext = () => {
    if (index >= fullText.length) {
      heroDescription.classList.remove('is-typing');
      heroDescription.classList.add('is-typed');
      return;
    }

    const char = fullText.charAt(index);
    heroDescription.textContent += char;
    index += 1;

    let delay = 27;
    if (char === ' ') delay = 14;
    if (char === ',' || char === ';' || char === ':') delay = 68;
    if (char === '.' || char === '!' || char === '?') delay = 135;

    window.setTimeout(typeNext, delay);
  };

  window.setTimeout(typeNext, 520);
}

initHeroTyping();

let heroResumeTimer = 0;
let heroVisible = true;
let lastRenderedFrameAt = performance.now();
let lastDecodeNudgeAt = 0;

function heroCanPlay() {
  return Boolean(heroVideo && heroVisible && !document.hidden && !modal?.open);
}

function configureHeroVideo() {
  if (!heroVideo) return;

  heroVideo.autoplay = true;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.preload = 'auto';
  heroVideo.setAttribute('muted', '');
  heroVideo.setAttribute('autoplay', '');
  heroVideo.setAttribute('loop', '');
  heroVideo.setAttribute('playsinline', '');
  heroVideo.setAttribute('webkit-playsinline', '');
  heroVideo.setAttribute('disablepictureinpicture', '');
  heroVideo.setAttribute('x-webkit-airplay', 'deny');

  try { heroVideo.disablePictureInPicture = true; } catch (_) {}
}

function resumeHero(restart = false) {
  if (!heroCanPlay() || !heroVideo) return;

  if (restart) {
    try { heroVideo.currentTime = 0; } catch (_) {}
  }

  const playPromise = heroVideo.play();
  if (playPromise?.catch) playPromise.catch(() => {});
}

function scheduleHeroResume(delay = 120) {
  window.clearTimeout(heroResumeTimer);
  heroResumeTimer = window.setTimeout(() => {
    if (!heroCanPlay() || !heroVideo) return;
    resumeHero(heroVideo.ended);
  }, delay);
}

function nudgeHeroDecoder() {
  if (!heroCanPlay() || !heroVideo) return;
  const now = performance.now();
  if (now - lastDecodeNudgeAt < 5000) return;
  lastDecodeNudgeAt = now;

  const position = heroVideo.currentTime || 0;
  try {
    heroVideo.pause();
    if (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
      heroVideo.currentTime = Math.min(position + 0.01, Math.max(0, heroVideo.duration - 0.05));
    }
  } catch (_) {}
  resumeHero(false);
}

if (heroVideo) {
  configureHeroVideo();

  const heroSection = heroVideo.closest('.hero');
  if ('IntersectionObserver' in window && heroSection) {
    const observer = new IntersectionObserver((entries) => {
      heroVisible = Boolean(entries[0]?.isIntersecting);
      if (heroVisible) scheduleHeroResume(40);
      else heroVideo.pause();
    }, { threshold: 0.02 });
    observer.observe(heroSection);
  }

  heroVideo.addEventListener('loadedmetadata', () => scheduleHeroResume(20), { once: true });
  heroVideo.addEventListener('canplay', () => scheduleHeroResume(20));
  heroVideo.addEventListener('playing', () => { lastRenderedFrameAt = performance.now(); });
  heroVideo.addEventListener('ended', () => scheduleHeroResume(20));
  heroVideo.addEventListener('pause', () => {
    if (heroCanPlay() && !heroVideo.ended) scheduleHeroResume(120);
  });
  heroVideo.addEventListener('stalled', () => scheduleHeroResume(180));

  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const trackFrame = () => {
      lastRenderedFrameAt = performance.now();
      heroVideo.requestVideoFrameCallback(trackFrame);
    };
    heroVideo.requestVideoFrameCallback(trackFrame);

    window.setInterval(() => {
      if (!heroCanPlay() || heroVideo.paused || heroVideo.readyState < 2) return;
      if (performance.now() - lastRenderedFrameAt > 2400) nudgeHeroDecoder();
    }, 900);
  } else {
    window.setInterval(() => {
      if (heroCanPlay() && heroVideo.paused) resumeHero(false);
    }, 1200);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !modal?.open) scheduleHeroResume(40);
  });
  window.addEventListener('pageshow', () => scheduleHeroResume(40));
  window.addEventListener('focus', () => scheduleHeroResume(60));

  ['pointerdown', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      if (heroCanPlay()) resumeHero(false);
    }, { passive: true });
  });

  resumeHero(false);
}

trailerPreview?.pause();

function openTrailer() {
  if (!modal || !modalVideo) return;
  heroVideo?.pause();
  trailerPreview?.pause();
  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open', '');
  modalVideo.currentTime = 0;
  modalVideo.muted = false;
  modalVideo.play().catch(() => {});
}

function closeTrailer() {
  if (!modal) return;
  modalVideo?.pause();
  if (typeof modal.close === 'function') modal.close();
  else modal.removeAttribute('open');
  scheduleHeroResume(40);
}

openTrailerButtons.forEach((button) => button.addEventListener('click', openTrailer));
closeTrailerButton?.addEventListener('click', closeTrailer);

modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeTrailer();
});

modal?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeTrailer();
});

modal?.addEventListener('close', () => {
  modalVideo?.pause();
  scheduleHeroResume(40);
});

function initMinecraftProfile() {
  if (!header) return;

  let account = null;
  try {
    const stored = localStorage.getItem('directive_minecraft_profile');
    if (stored) account = JSON.parse(stored);
  } catch (_) {}

  if (!account?.gamertag) {
    try {
      const fallbackGamertag = sessionStorage.getItem('directive_minecraft_gamertag') || '';
      const fallbackXuid = sessionStorage.getItem('directive_minecraft_xuid') || '';
      if (fallbackGamertag) account = { gamertag: fallbackGamertag, xuid: fallbackXuid, gamerpic: '', authenticated: true };
    } catch (_) {}
  }

  if (!account?.gamertag) return;

  const brand = header.querySelector('.brand');
  if (!brand) return;

  header.classList.add('has-player-profile');
  const stack = document.createElement('div');
  stack.className = 'header-profile-stack';
  brand.parentNode.insertBefore(stack, brand);
  stack.appendChild(brand);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'player-profile-button';
  button.setAttribute('aria-label', `Profile ${account.gamertag}`);
  button.setAttribute('aria-expanded', 'false');

  const avatar = document.createElement('span');
  avatar.className = 'player-profile-avatar';
  const initials = (account.gamertag || 'MC').slice(0, 2).toUpperCase();
  avatar.textContent = initials;

  if (account.gamerpic) {
    const img = document.createElement('img');
    img.src = account.gamerpic;
    img.alt = `${account.gamertag} avatar`;
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('load', () => { avatar.textContent = ''; avatar.appendChild(img); }, { once: true });
  }

  const name = document.createElement('span');
  name.className = 'player-profile-gamertag';
  name.textContent = account.gamertag;

  const chevron = document.createElement('span');
  chevron.className = 'player-profile-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';

  button.append(avatar, name, chevron);
  stack.appendChild(button);

  const panel = document.createElement('div');
  panel.className = 'player-profile-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <span class="player-profile-status"><i></i> Xbox verified</span>
    <strong>${String(account.gamertag).replace(/[&<>"']/g, '')}</strong>
    <small>${account.gamerscore ? `Gamerscore ${String(account.gamerscore).replace(/[&<>"']/g, '')}` : 'Minecraft identity connected'}</small>
  `;
  stack.appendChild(panel);

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
    if (!open) requestAnimationFrame(() => panel.classList.add('is-open'));
    else panel.classList.remove('is-open');
  });

  document.addEventListener('pointerdown', (event) => {
    if (stack.contains(event.target)) return;
    button.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    panel.hidden = true;
  });

  const style = document.createElement('style');
  style.textContent = `
    .site-header.has-player-profile{--profile-accent:#70e224;height:96px}
    .header-profile-stack{position:relative;display:grid;justify-self:start;align-self:center;gap:8px;min-width:0;z-index:3}
    .header-profile-stack>.brand{font-size:24px}
    .player-profile-button{height:32px;max-width:240px;display:inline-flex;align-items:center;gap:8px;padding:3px 8px 3px 4px;border:1px solid rgba(255,255,255,.14);background:rgba(6,9,8,.52);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;color:#f3f5f3;transition:border-color .18s ease,background .18s ease,transform .18s ease}
    .player-profile-button:hover,.player-profile-button:focus-visible{border-color:rgba(112,226,36,.55);background:rgba(10,15,12,.78)}
    .player-profile-avatar{width:24px;height:24px;flex:0 0 24px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(112,226,36,.55);background:#101712;color:#70e224;font-size:8px;font-weight:900;letter-spacing:.04em}
    .player-profile-avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .player-profile-gamertag{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:850;letter-spacing:.06em}
    .player-profile-chevron{margin-left:auto;color:#70e224;font-size:13px;line-height:1;transition:transform .18s ease}
    .player-profile-button[aria-expanded="true"] .player-profile-chevron{transform:rotate(180deg)}
    .player-profile-panel{position:absolute;left:0;top:calc(100% + 8px);width:220px;padding:16px;border:1px solid rgba(255,255,255,.14);background:rgba(5,8,7,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 18px 45px rgba(0,0,0,.35);opacity:0;transform:translateY(-5px);transition:opacity .16s ease,transform .16s ease}
    .player-profile-panel.is-open{opacity:1;transform:none}
    .player-profile-panel strong,.player-profile-panel small{display:block}.player-profile-panel strong{margin-top:10px;font-size:15px}.player-profile-panel small{margin-top:4px;color:#8f9992;font-size:10px}
    .player-profile-status{display:flex;align-items:center;gap:7px;color:#aeb8b1;font-size:8px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}.player-profile-status i{width:6px;height:6px;border-radius:50%;background:#70e224;box-shadow:0 0 12px rgba(112,226,36,.7)}
    @media(max-width:900px){.site-header.has-player-profile{height:96px}.header-profile-stack{gap:7px}.player-profile-button{max-width:190px}.desktop-nav{display:none}.menu-button{display:block}}
    @media(max-width:620px){.site-header.has-player-profile{height:96px;padding-inline:24px}.header-profile-stack>.brand{font-size:22px}.player-profile-button{height:30px;max-width:176px}.player-profile-avatar{width:22px;height:22px;flex-basis:22px}.player-profile-gamertag{font-size:9px}.player-profile-panel{width:min(220px,calc(100vw - 48px))}}
  `;
  document.head.appendChild(style);

  document.documentElement.style.setProperty('--header-h', '96px');
}

initMinecraftProfile();

import('./cookie.js?v=1').catch(() => {});
