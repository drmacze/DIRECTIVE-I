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
