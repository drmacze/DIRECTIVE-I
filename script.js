const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const modal = document.querySelector('[data-trailer-modal]');
const modalVideo = document.querySelector('[data-modal-video]');
const heroVideo = document.querySelector('[data-hero-video]');
const trailerPreview = document.querySelector('[data-trailer-preview]');
const openTrailerButtons = document.querySelectorAll('[data-open-trailer]');
const closeTrailerButton = document.querySelector('[data-close-trailer]');

const HERO_BACKGROUND_URL = 'https://image-link.edgeone.app/1788957619264-ml7zjo.mp4';
const HERO_LOCAL_FALLBACK = 'assets/directive-i-transmission-001.mp4';

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

let heroInView = true;
let usingHeroFallback = false;
let recoveryTimer = 0;

function heroShouldPlay() {
  return Boolean(heroVideo && !document.hidden && !modal?.open && heroInView);
}

function setHeroSource(src) {
  if (!heroVideo) return;
  heroVideo.src = src;
  heroVideo.load();
}

function playHero({ resetIfEnded = false } = {}) {
  if (!heroShouldPlay() || !heroVideo) return;
  heroVideo.muted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  if (resetIfEnded && (heroVideo.ended || (Number.isFinite(heroVideo.duration) && heroVideo.currentTime >= heroVideo.duration - 0.08))) {
    try { heroVideo.currentTime = 0; } catch (_) {}
  }
  if (heroVideo.paused || heroVideo.ended) heroVideo.play().catch(() => {});
}

function scheduleHeroRecovery(delay = 350) {
  window.clearTimeout(recoveryTimer);
  recoveryTimer = window.setTimeout(() => playHero({ resetIfEnded: true }), delay);
}

if (heroVideo) {
  heroVideo.preload = 'auto';
  heroVideo.muted = true;
  heroVideo.loop = true;
  heroVideo.setAttribute('playsinline', '');
  heroVideo.setAttribute('webkit-playsinline', '');

  // Force the direct source once so iOS does not stay on an older locally cached asset.
  setHeroSource(HERO_BACKGROUND_URL);

  heroVideo.addEventListener('loadeddata', () => playHero());
  heroVideo.addEventListener('canplay', () => playHero());
  heroVideo.addEventListener('ended', () => playHero({ resetIfEnded: true }));
  heroVideo.addEventListener('pause', () => {
    if (heroShouldPlay()) scheduleHeroRecovery(180);
  });
  heroVideo.addEventListener('stalled', () => {
    if (heroShouldPlay()) scheduleHeroRecovery(700);
  });
  heroVideo.addEventListener('waiting', () => {
    if (heroShouldPlay()) scheduleHeroRecovery(700);
  });
  heroVideo.addEventListener('error', () => {
    if (usingHeroFallback) return;
    usingHeroFallback = true;
    setHeroSource(HERO_LOCAL_FALLBACK);
    playHero();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      heroInView = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.08);
      if (heroInView) playHero({ resetIfEnded: true });
      else heroVideo.pause();
    }, { threshold: [0, 0.08, 0.25] });
    observer.observe(heroVideo.closest('.hero') || heroVideo);
  }

  // Safari/iOS can pause muted background video after temporary network or memory pressure.
  // Resume only while the hero is visible and no trailer modal is open.
  window.setInterval(() => {
    if (heroShouldPlay() && (heroVideo.paused || heroVideo.ended)) {
      playHero({ resetIfEnded: true });
    }
  }, 2000);

  playHero();
}

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
  playHero({ resetIfEnded: true });
  trailerPreview?.play().catch(() => {});
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
  playHero({ resetIfEnded: true });
  trailerPreview?.play().catch(() => {});
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heroVideo?.pause();
    trailerPreview?.pause();
  } else if (!modal?.open) {
    playHero({ resetIfEnded: true });
    trailerPreview?.play().catch(() => {});
  }
});

window.addEventListener('pageshow', () => playHero({ resetIfEnded: true }));
window.addEventListener('focus', () => playHero({ resetIfEnded: true }));
