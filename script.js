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

  // requestVideoFrameCallback lets us detect the iOS/WKWebView case where the
  // media element reports "playing" but its composited video frame stops updating.
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
    // Older webviews: only recover from an actual paused state.
    window.setInterval(() => {
      if (heroCanPlay() && heroVideo.paused) resumeHero(false);
    }, 1200);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !modal?.open) scheduleHeroResume(40);
  });
  window.addEventListener('pageshow', () => scheduleHeroResume(40));
  window.addEventListener('focus', () => scheduleHeroResume(60));

  // A real user gesture gives restrictive in-app browsers another chance to
  // authorize inline playback without exposing an extra play button.
  ['pointerdown', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      if (heroCanPlay()) resumeHero(false);
    }, { passive: true });
  });

  resumeHero(false);
}

// The trailer preview deliberately stays poster-only. Running two autoplaying
// videos at once can make iOS suspend the fullscreen hero after its first frames.
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
