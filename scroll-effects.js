(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const headerOffset = () => Math.max(0, document.querySelector('.site-header')?.offsetHeight || 0);

  const revealGroups = [
    ['.overview-section .section-heading', 'heading', 0],
    ['.overview-section .section-copy', 'heading', 120],
    ['.feature-strip article', 'card', 0],
    ['.trailer-heading > div', 'heading', 0],
    ['.trailer-heading > p', 'heading', 100],
    ['.trailer-card', 'card', 80],
    ['.systems-heading', 'heading', 0],
    ['.system-card', 'card', 0],
    ['.intel-card > div', 'heading', 0],
    ['.intel-copy', 'heading', 120],
    ['.site-footer .footer-grid > *', 'card', 0]
  ];

  const revealTargets = [];

  revealGroups.forEach(([selector, type, baseDelay]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (element.hasAttribute('data-scroll-reveal')) return;
      element.setAttribute('data-scroll-reveal', type);
      const stagger = selector.includes('article') || selector.includes('.system-card') || selector.includes('footer-grid')
        ? index * 85
        : index * 70;
      element.style.setProperty('--reveal-delay', `${baseDelay + stagger}ms`);
      revealTargets.push(element);
    });
  });

  document.body.classList.add('scroll-fx-ready');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('is-scroll-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-scroll-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealTargets.forEach((element) => observer.observe(element));
  }

  // Custom anchor easing: smooth without hijacking normal touch/wheel scrolling.
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(targetY, duration = 980) {
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const targetY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset());
      smoothScrollTo(targetY);

      try {
        history.replaceState(null, '', href);
      } catch (_) {}
    });
  });

  // Lightweight hero scroll response. Uses one RAF per frame and only runs near the hero.
  const heroCopy = document.querySelector('.hero-copy');
  const heroMeta = document.querySelector('.hero-meta');
  let framePending = false;

  function updateHeroMotion() {
    framePending = false;
    if (reduceMotion || !heroCopy) return;

    const viewport = Math.max(window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, window.scrollY / viewport));
    const eased = 1 - Math.pow(1 - progress, 3);

    heroCopy.style.transform = `translate3d(0, ${(-18 * eased).toFixed(2)}px, 0)`;
    if (heroMeta) heroMeta.style.transform = `translate3d(0, ${(-10 * eased).toFixed(2)}px, 0)`;
  }

  function requestHeroMotion() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateHeroMotion);
  }

  window.addEventListener('scroll', requestHeroMotion, { passive: true });
  window.addEventListener('resize', requestHeroMotion, { passive: true });
  requestHeroMotion();
})();
