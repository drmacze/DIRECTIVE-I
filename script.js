const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const modal = document.querySelector('[data-trailer-modal]');
const modalVideo = document.querySelector('[data-modal-video]');
const heroVideo = document.querySelector('[data-hero-video]');
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

let heroResumeTimer = 0;

function heroCanPlay() {
  return Boolean(heroVideo && !document.hidden && !modal?.open);
}

function configureHeroVideo() {
  if (!heroVideo) return;

  // Keep the source declared in HTML. Reassigning heroVideo.src here caused
  // Safari/iOS to abort the first request and begin downloading the same MP4 again.
  heroVideo.autoplay = true;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.preload = 'auto';
  heroVideo.setAttribute('muted', '');
  heroVideo.setAttribute('playsinline', '');
  heroVideo.setAttribute('webkit-playsinline', '');
  heroVideo.setAttribute('disablepictureinpicture', '');

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

function scheduleHeroResume(delay = 220) {
  window.clearTimeout(heroResumeTimer);
  heroResumeTimer = window.setTimeout(() => {
    if (!heroCanPlay() || !heroVideo) return;
    if (heroVideo.ended) resumeHero(true);
    else if (heroVideo.paused) resumeHero(false);
  }, delay);
}

if (heroVideo) {
  configureHeroVideo();

  // Native loop is the primary loop mechanism. These handlers only recover
  // from browser/OS pauses; buffering events are intentionally left alone so
  // Safari can manage its own network buffer without playback thrashing.
  heroVideo.addEventListener('loadedmetadata', () => resumeHero(false), { once: true });
  heroVideo.addEventListener('canplay', () => resumeHero(false), { once: true });
  heroVideo.addEventListener('ended', () => resumeHero(true));
  heroVideo.addEventListener('pause', () => {
    if (heroCanPlay() && !heroVideo.ended) scheduleHeroResume(240);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !modal?.open) scheduleHeroResume(80);
  });
  window.addEventListener('pageshow', () => scheduleHeroResume(80));
  window.addEventListener('focus', () => scheduleHeroResume(120));
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
  scheduleHeroResume(60);
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
  scheduleHeroResume(60);
  trailerPreview?.play().catch(() => {});
});
