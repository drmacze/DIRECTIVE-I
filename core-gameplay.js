(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lines = Array.from(document.querySelectorAll('[data-core-line]'));
  const scrollHint = document.querySelector('[data-scroll-hint]');
  const track = document.querySelector('[data-core-track]');
  const handoff = document.querySelector('[data-docs-handoff]');
  const handoffPage = document.querySelector('[data-docs-handoff-page]');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  let committed = false;
  let raf = 0;
  let lenis = null;
  let lenisRaf = 0;

  function renderLines() {
    if (reduceMotion || committed) return;
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

  function renderScrollHint() {
    if (!scrollHint || !handoff || committed) {
      scrollHint?.classList.remove('is-visible');
      return;
    }

    const docsStarted = window.scrollY >= handoff.offsetTop + 2;
    scrollHint.classList.toggle('is-visible', !docsStarted);
  }

  function stopLenis() {
    if (lenisRaf) cancelAnimationFrame(lenisRaf);
    lenisRaf = 0;

    if (lenis) {
      try { lenis.destroy(); } catch (_) {}
      lenis = null;
    }
  }

  function commitDocumentation() {
    if (committed) return;
    committed = true;
    scrollHint?.classList.remove('is-visible');
    stopLenis();

    document.body.classList.add('docs-committed');
    document.title = 'DIRECTIVE I — Documentation';

    if (handoffPage) {
      handoffPage.style.transform = 'none';
      handoffPage.style.opacity = '1';
      handoffPage.style.filter = 'none';
    }

    try {
      history.replaceState({ directiveView: 'documentation' }, '', 'documentation.html');
      sessionStorage.removeItem('directive_docs_handoff');
    } catch (_) {}

    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    });
  }

  function renderHandoff() {
    if (!handoff || !handoffPage || committed) return;

    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const sectionTop = handoff.offsetTop;
    const travel = Math.max(1, handoff.offsetHeight - viewport);
    const raw = clamp((window.scrollY - sectionTop) / travel, 0, 1);
    const eased = raw * raw * (3 - 2 * raw);

    const y = (1 - eased) * 104;
    const scale = .985 + eased * .015;
    const opacity = .68 + eased * .32;
    const blur = (1 - eased) * 2;

    handoffPage.style.transform = `translate3d(0,${y.toFixed(3)}%,0) scale(${scale.toFixed(4)})`;
    handoffPage.style.opacity = opacity.toFixed(3);
    handoffPage.style.filter = `blur(${blur.toFixed(2)}px)`;

    if (track) {
      const fade = clamp(raw * 1.1, 0, 1);
      track.style.opacity = String(1 - fade * .55);
      track.style.filter = `blur(${(fade * 7).toFixed(2)}px)`;
      track.style.transform = `translate3d(0,${(-fade * 34).toFixed(2)}px,0) scale(${(1 - fade * .018).toFixed(4)})`;
    }

    document.documentElement.style.setProperty('--docs-handoff-progress', raw.toFixed(4));

    if (raw >= .998) commitDocumentation();
  }

  function render() {
    renderLines();
    renderScrollHint();
    renderHandoff();
  }

  const schedule = () => {
    if (raf || committed) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  };

  function initLenis() {
    if (reduceMotion || committed || typeof window.Lenis !== 'function') return;

    lenis = new window.Lenis({
      autoRaf: false,
      duration: 1.15,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: .085,
      touchMultiplier: 1,
      wheelMultiplier: .9,
      overscroll: true
    });

    lenis.on('scroll', schedule);

    const loop = (time) => {
      if (!lenis || committed) return;
      lenis.raf(time);
      lenisRaf = requestAnimationFrame(loop);
    };

    lenisRaf = requestAnimationFrame(loop);
  }

  initLenis();
  render();

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  addEventListener('pagehide', stopLenis);
})();
