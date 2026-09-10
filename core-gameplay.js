(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lines = Array.from(document.querySelectorAll('[data-core-line]'));
  const navButton = document.querySelector('[data-core-nav]');
  const navPanel = document.querySelector('[data-core-nav-panel]');

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function render() {
    if (reduceMotion) return;
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const center = viewport * .5;

    lines.forEach((line) => {
      const rect = line.getBoundingClientRect();
      const lineCenter = rect.top + rect.height * .5;
      const distance = (lineCenter - center) / viewport;
      const abs = Math.abs(distance);
      const focus = 1 - clamp(abs / .74, 0, 1);

      const rotateX = clamp(distance * -44, -42, 42);
      const translateZ = -120 + focus * 120;
      const translateY = distance * 34;
      const scale = .88 + focus * .12;
      const opacity = .16 + focus * .84;
      const blur = (1 - focus) * 7;

      line.style.transform = `translate3d(0,${translateY}px,${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
      line.style.opacity = opacity.toFixed(3);
      line.style.filter = `blur(${blur.toFixed(2)}px)`;
    });
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  };

  if (!reduceMotion) {
    render();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('pageshow', schedule);
  }

  const closeNav = () => {
    navButton?.setAttribute('aria-expanded', 'false');
    navPanel?.classList.remove('is-open');
    navPanel?.setAttribute('aria-hidden', 'true');
  };

  navButton?.addEventListener('click', () => {
    const open = navButton.getAttribute('aria-expanded') === 'true';
    navButton.setAttribute('aria-expanded', String(!open));
    navPanel?.classList.toggle('is-open', !open);
    navPanel?.setAttribute('aria-hidden', String(open));
  });

  document.addEventListener('pointerdown', (event) => {
    if (navButton?.contains(event.target) || navPanel?.contains(event.target)) return;
    closeNav();
  });
})();
