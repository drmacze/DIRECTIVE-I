(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const revealItems = Array.from(document.querySelectorAll('[data-story-reveal]'));

  revealItems.forEach((element, index) => {
    if (!element.style.getPropertyValue('--story-delay')) {
      element.style.setProperty('--story-delay', `${Math.min(index * 70, 280)}ms`);
    }
  });

  document.body.classList.add('story-fx-ready');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((element) => element.classList.add('is-story-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-story-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((element) => observer.observe(element));
  }

  function easeInOutCubic(t) {
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothTo(targetY, duration = 980) {
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
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
      const header = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - header);
      smoothTo(top);
      try { history.replaceState(null, '', href); } catch (_) {}
    });
  });
})();
