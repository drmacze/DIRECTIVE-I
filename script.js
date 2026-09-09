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

function installCinematicHeroTuning() {
  const style = document.createElement('style');
  style.dataset.directiveHeroTuning = 'true';
  style.textContent = `
    .hero-video {
      object-position: center center !important;
      filter: saturate(.92) contrast(1.04) brightness(.96) !important;
      transform: scale(1.005) !important;
    }
    .hero-vignette {
      background:
        linear-gradient(90deg, rgba(4,6,6,.84) 0%, rgba(4,6,6,.54) 34%, rgba(4,6,6,.12) 66%, rgba(4,6,6,.18) 100%),
        linear-gradient(0deg, rgba(7,9,9,.74) 0%, rgba(7,9,9,.08) 42%, rgba(7,9,9,.12) 100%) !important;
    }
    @media (max-width: 620px) {
      .hero-video {
        object-position: center center !important;
        filter: saturate(.94) contrast(1.03) brightness(.94) !important;
      }
      .hero-vignette {
        background: linear-gradient(0deg,
          rgba(7,9,9,.88) 0%,
          rgba(7,9,9,.48) 43%,
          rgba(7,9,9,.16) 70%,
          rgba(7,9,9,.08) 100%) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function loadHighQualityHeroVideo() {
  if (!heroVideo) return;

  let usingFallback = false;
  heroVideo.preload = 'auto';
  heroVideo.muted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;

  const fallbackToLocal = () => {
    if (usingFallback) return;
    usingFallback = true;
    heroVideo.src = HERO_LOCAL_FALLBACK;
    heroVideo.load();
    heroVideo.play().catch(() => {});
  };

  heroVideo.addEventListener('error', fallbackToLocal, { once: true });
  heroVideo.src = HERO_BACKGROUND_URL;
  heroVideo.load();
  heroVideo.play().catch(() => {});
}

installCinematicHeroTuning();
loadHighQualityHeroVideo();

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
  heroVideo?.play().catch(() => {});
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
  heroVideo?.play().catch(() => {});
  trailerPreview?.play().catch(() => {});
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heroVideo?.pause();
    trailerPreview?.pause();
  } else if (!modal?.open) {
    heroVideo?.play().catch(() => {});
    trailerPreview?.play().catch(() => {});
  }
});
