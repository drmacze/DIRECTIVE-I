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
const HERO_FALLBACK_URL = 'assets/directive-i-transmission-001.mp4';

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

let usingHeroFallback = false;
let heroRecoveryTimer = 0;

function heroCanPlay() {
  return Boolean(heroVideo && !document.hidden && !modal?.open);
}

function configureHeroVideo() {
  if (!heroVideo) return;
  heroVideo.preload = 'auto';
  heroVideo.autoplay = true;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.setAttribute('playsinline', '');
  heroVideo.setAttribute('webkit-playsinline', '');
  heroVideo.setAttribute('disablepictureinpicture', '');
  heroVideo.src = HERO_BACKGROUND_URL;
  heroVideo.load();
}

function resumeHero(reset = false) {
  if (!heroCanPlay() || !heroVideo) return;
  if (reset || heroVideo.ended) {
    try { heroVideo.currentTime = 0; } catch (_) {}
  }
  const promise = heroVideo.play();
  if (promise?.catch) promise.catch(() => {});
}

function recoverHero(delay = 250) {
  window.clearTimeout(heroRecoveryTimer);
  heroRecoveryTimer = window.setTimeout(() => {
    if (!heroCanPlay() || !heroVideo) return;
    if (heroVideo.ended || (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0 && heroVideo.currentTime >= heroVideo.duration - 0.12)) {
      resumeHero(true);
      return;
    }
    if (heroVideo.paused) resumeHero(false);
  }, delay);
}

if (heroVideo) {
  configureHeroVideo();
  heroVideo.addEventListener('loadedmetadata', () => resumeHero(false));
  heroVideo.addEventListener('canplay', () => resumeHero(false));
  heroVideo.addEventListener('ended', () => resumeHero(true));
  heroVideo.addEventListener('pause', () => {
    if (heroCanPlay()) recoverHero(180);
  });
  heroVideo.addEventListener('waiting', () => recoverHero(500));
  heroVideo.addEventListener('stalled', () => recoverHero(700));
  heroVideo.addEventListener('suspend', () => recoverHero(500));
  heroVideo.addEventListener('error', () => {
    if (usingHeroFallback) return;
    usingHeroFallback = true;
    heroVideo.src = HERO_FALLBACK_URL;
    heroVideo.load();
    resumeHero(false);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !modal?.open) resumeHero(false);
  });
  window.addEventListener('pageshow', () => resumeHero(false));
  window.addEventListener('focus', () => resumeHero(false));
  document.addEventListener('touchstart', () => {
    if (heroCanPlay() && heroVideo.paused) resumeHero(false);
  }, { passive: true });

  resumeHero(false);
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
  resumeHero(false);
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
  resumeHero(false);
  trailerPreview?.play().catch(() => {});
});
