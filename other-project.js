(() => {
  const overlay = document.querySelector('[data-other-project-overlay]');
  const sheet = document.querySelector('[data-other-project-sheet]');
  const openers = document.querySelectorAll('[data-open-other-project]');
  const closers = document.querySelectorAll('[data-other-project-close]');
  const hold = document.querySelector('[data-realm-hold]');
  const fill = document.querySelector('[data-realm-hold-fill]');
  const percent = document.querySelector('[data-realm-hold-percent]');
  const transition = document.querySelector('[data-realm-transition]');
  const TARGET = 'https://drmacze.github.io/REALM-DIVIDED/';
  const HOLD_MS = 1350;

  if (!overlay || !sheet || !hold || !transition) return;

  let holding = false;
  let completed = false;
  let startAt = 0;
  let raf = 0;
  let progress = 0;
  let resetRaf = 0;
  let previousOverflow = '';

  const setProgress = value => {
    progress = Math.max(0, Math.min(1, value));
    hold.style.setProperty('--hold-progress', String(progress));
    if (percent) percent.textContent = `${Math.round(progress * 100)}%`;
  };

  const open = event => {
    event?.preventDefault?.();
    if (overlay.classList.contains('is-open')) return;
    previousOverflow = document.documentElement.style.overflow || '';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    window.DIRECTIVE_ANALYTICS?.track?.('other_project_open', { project: 'REALM DIVIDED' });
    requestAnimationFrame(() => sheet.focus?.({ preventScroll: true }));
  };

  const close = event => {
    event?.preventDefault?.();
    if (!overlay.classList.contains('is-open') || completed) return;
    cancelHold();
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = previousOverflow;
    document.body.style.overflow = previousOverflow;
  };

  const animateReset = () => {
    cancelAnimationFrame(resetRaf);
    const from = progress;
    const started = performance.now();
    const duration = 260;
    const tick = now => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(from * (1 - eased));
      if (t < 1) resetRaf = requestAnimationFrame(tick);
    };
    resetRaf = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (completed) return;
    completed = true;
    holding = false;
    cancelAnimationFrame(raf);
    setProgress(1);
    hold.classList.remove('is-holding');
    hold.classList.add('is-ready');
    if (percent) percent.textContent = 'OPENING';
    window.DIRECTIVE_ANALYTICS?.track?.('other_project_visit', { project: 'REALM DIVIDED' });
    window.setTimeout(() => {
      transition.classList.add('is-active');
      transition.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => { location.href = TARGET; }, 760);
    }, 120);
  };

  const tick = now => {
    if (!holding || completed) return;
    const p = (now - startAt) / HOLD_MS;
    setProgress(p);
    if (p >= 1) finish();
    else raf = requestAnimationFrame(tick);
  };

  function startHold(event) {
    if (completed || holding) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    cancelAnimationFrame(resetRaf);
    holding = true;
    startAt = performance.now() - progress * HOLD_MS;
    hold.classList.add('is-holding');
    try { if (event?.pointerId != null) hold.setPointerCapture(event.pointerId); } catch (_) {}
    raf = requestAnimationFrame(tick);
  }

  function cancelHold(event) {
    if (completed) return;
    event?.preventDefault?.();
    holding = false;
    cancelAnimationFrame(raf);
    hold.classList.remove('is-holding');
    if (progress > 0) animateReset();
  }

  openers.forEach(el => el.addEventListener('click', open));
  closers.forEach(el => el.addEventListener('click', close));
  overlay.addEventListener('click', event => {
    if (event.target === overlay || event.target.matches?.('[data-other-project-backdrop]')) close(event);
  });
  sheet.addEventListener('click', event => event.stopPropagation());

  hold.addEventListener('pointerdown', startHold);
  hold.addEventListener('pointerup', cancelHold);
  hold.addEventListener('pointercancel', cancelHold);
  hold.addEventListener('lostpointercapture', cancelHold);
  hold.addEventListener('contextmenu', event => event.preventDefault());
  hold.addEventListener('click', event => event.preventDefault());
  hold.addEventListener('keydown', event => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) startHold(event);
  });
  hold.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') cancelHold(event);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close(event);
  });
})();