(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lines = Array.from(document.querySelectorAll('[data-core-line]'));
  const track = document.querySelector('[data-core-track]');
  const handoff = document.querySelector('[data-docs-handoff]');
  const handoffPage = document.querySelector('[data-docs-handoff-page]');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  let routed = false;
  let raf = 0;

  function renderLines() {
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

  function renderHandoff() {
    if (!handoff || !handoffPage) return;
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const rect = handoff.getBoundingClientRect();
    const progress = clamp(1 - rect.top / viewport, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const y = (1 - eased) * 100;

    handoffPage.style.transform = `translate3d(0,${y.toFixed(3)}%,0)`;
    handoffPage.style.opacity = String(.72 + eased * .28);

    if (track) {
      track.style.opacity = String(1 - progress * .42);
      track.style.filter = `blur(${(progress * 5).toFixed(2)}px)`;
      track.style.transform = `translate3d(0,${(-progress * 18).toFixed(2)}px,0) scale(${(1 - progress * .012).toFixed(4)})`;
    }

    if (progress >= .997 && !routed) {
      routed = true;
      handoff.classList.add('is-complete');
      try { sessionStorage.setItem('directive_docs_handoff', '1'); } catch (_) {}
      window.setTimeout(() => {
        window.location.replace('documentation.html?from=core');
      }, reduceMotion ? 0 : 90);
    }
  }

  function render() {
    renderLines();
    renderHandoff();
  }

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  };

  render();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
})();