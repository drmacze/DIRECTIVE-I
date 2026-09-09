(() => {
  const qs = (s, root = document) => root.querySelector(s);
  const STATS_ENDPOINT = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-stats';
  const root = qs('.welcome-shell');
  const welcomePanel = qs('[data-stage-panel="welcome"]');
  const termsPanel = qs('[data-stage-panel="terms"]');
  const licensePanel = qs('[data-stage-panel="license"]');
  const loginSheet = qs('[data-login-sheet]');
  const backdrop = qs('[data-sheet-backdrop]');
  const closeLogin = qs('[data-close-login]');
  const minecraftLoginButton = qs('[data-minecraft-login]');
  const termsReader = qs('[data-terms-reader]');
  const readerEnd = qs('[data-reader-end]');
  const termsConsent = qs('[data-terms-consent]');
  const termsCheck = qs('[data-terms-check]');
  const licenseCheck = qs('[data-license-check]');
  const faqPanel = qs('[data-faq-panel]');
  const nextButton = qs('[data-next-button]');
  const transition = qs('[data-portal-transition]');
  const loginCount = qs('[data-login-count]');
  const playCount = qs('[data-play-count]');
  const swipeTrack = qs('[data-swipe-track]');
  const swipeHandle = qs('[data-swipe-handle]');
  const swipeProgress = qs('[data-swipe-progress]');
  const swipeLabel = qs('[data-swipe-label]');

  const storage = {
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) {}
    }
  };

  const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatCount(value) {
    return numberFormatter.format(Math.max(0, Math.floor(Number(value) || 0)));
  }

  function animateCount(element, target, duration = 18000) {
    if (!element) return;
    const safeTarget = Math.max(0, Math.floor(Number(target) || 0));
    const savedValue = Number.isFinite(element._directiveCountValue)
      ? Math.floor(element._directiveCountValue)
      : null;
    const lead = Math.min(40, safeTarget);
    const from = savedValue === null
      ? Math.max(0, safeTarget - lead)
      : Math.min(savedValue, safeTarget);

    if (element._directiveCountFrame) cancelAnimationFrame(element._directiveCountFrame);

    if (reducedMotion || from === safeTarget) {
      element._directiveCountValue = safeTarget;
      element.textContent = formatCount(safeTarget);
      return;
    }

    element._directiveCountValue = from;
    element.textContent = formatCount(from);

    const started = performance.now();
    const distance = safeTarget - from;
    const smoothStep = (t) => t * t * (3 - 2 * t);
    let lastShown = from;

    const frame = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = smoothStep(t);
      const next = Math.min(safeTarget, from + Math.floor(distance * eased));

      if (next !== lastShown) {
        lastShown = next;
        element._directiveCountValue = next;
        element.textContent = formatCount(next);
      }

      if (t < 1) {
        element._directiveCountFrame = requestAnimationFrame(frame);
      } else {
        element._directiveCountFrame = 0;
        element._directiveCountValue = safeTarget;
        element.textContent = formatCount(safeTarget);
      }
    };

    element._directiveCountFrame = requestAnimationFrame(frame);
  }

  function setNetworkScope(element) {
    const scope = element?.closest('article')?.querySelector('em');
    if (scope) scope.textContent = 'Global network';
  }

  function renderStats(stats, duration = 18000) {
    const accountLogins = Math.max(10000, Number(stats?.accountLogins) || 10000);
    const lifetimeUserPlays = Math.max(0, Number(stats?.lifetimeUserPlays) || 0);
    setNetworkScope(loginCount);
    setNetworkScope(playCount);
    animateCount(loginCount, accountLogins, duration);
    animateCount(playCount, lifetimeUserPlays, duration);
  }

  async function fetchNetworkStats() {
    try {
      const response = await fetch(`${STATS_ENDPOINT}?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok || !data?.stats) return;
      renderStats(data.stats, 18000);
    } catch (_) {}
  }

  renderStats({ accountLogins: 10000, lifetimeUserPlays: 1 }, 18000);
  window.setTimeout(fetchNetworkStats, 350);

  function openLogin() {
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add('is-visible');
      loginSheet.classList.add('is-visible');
      loginSheet.setAttribute('aria-hidden', 'false');
    });
    setTimeout(() => minecraftLoginButton?.focus(), 420);
  }

  function closeLoginSheet() {
    backdrop.classList.remove('is-visible');
    loginSheet.classList.remove('is-visible');
    loginSheet.setAttribute('aria-hidden', 'true');
    setTimeout(() => { backdrop.hidden = true; }, 360);
  }

  closeLogin?.addEventListener('click', closeLoginSheet);
  backdrop?.addEventListener('click', closeLoginSheet);

  let dragging = false;
  let startX = 0;
  let currentX = 0;
  let maxX = 0;

  function measureSwipe() {
    if (!swipeTrack || !swipeHandle) return;
    maxX = Math.max(0, swipeTrack.clientWidth - swipeHandle.offsetWidth - 12);
  }

  function setSwipe(x, animate = false) {
    currentX = Math.min(maxX, Math.max(0, x));
    swipeHandle.style.transition = animate ? 'transform .38s cubic-bezier(.16,1,.3,1)' : 'none';
    swipeProgress.style.transition = animate ? 'width .38s cubic-bezier(.16,1,.3,1)' : 'none';
    swipeHandle.style.transform = `translate3d(${currentX}px,0,0)`;
    swipeProgress.style.width = `${currentX + swipeHandle.offsetWidth + 6}px`;
  }

  function finishSwipe() {
    setSwipe(maxX, true);
    swipeLabel.textContent = 'Identity required';
    setTimeout(openLogin, 260);
  }

  function resetSwipe() {
    setSwipe(0, true);
    swipeLabel.textContent = 'Swipe to start';
  }

  swipeHandle?.addEventListener('pointerdown', (event) => {
    measureSwipe();
    dragging = true;
    startX = event.clientX - currentX;
    swipeHandle.setPointerCapture?.(event.pointerId);
  });

  swipeHandle?.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    setSwipe(event.clientX - startX);
  });

  function endSwipe() {
    if (!dragging) return;
    dragging = false;
    if (maxX && currentX / maxX >= .86) finishSwipe();
    else resetSwipe();
  }

  swipeHandle?.addEventListener('pointerup', endSwipe);
  swipeHandle?.addEventListener('pointercancel', endSwipe);
  swipeHandle?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      measureSwipe();
      finishSwipe();
    }
  });
  window.addEventListener('resize', () => { measureSwipe(); if (!dragging) resetSwipe(); }, { passive: true });
  measureSwipe();

  function activatePanel(nextPanel, direction = 1) {
    [welcomePanel, termsPanel, licensePanel].forEach((panel) => {
      if (!panel || panel === nextPanel) return;
      panel.classList.remove('is-active', 'stage-active');
      panel.style.opacity = '0';
      panel.style.transform = `translate3d(${direction < 0 ? '5%' : '-5%'},0,0)`;
      setTimeout(() => { panel.hidden = true; }, 520);
    });

    nextPanel.hidden = false;
    nextPanel.style.opacity = '0';
    nextPanel.style.transform = `translate3d(${direction > 0 ? '8%' : '-8%'},0,0)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      nextPanel.classList.add('is-active');
      nextPanel.style.opacity = '';
      nextPanel.style.transform = '';
      if (nextPanel === termsPanel) setTimeout(unlockTermsConsent, 80);
    }));
  }

  window.addEventListener('directive:minecraft-authenticated', (event) => {
    const account = event.detail || {};
    storage.set('directive_local_session', String(Date.now()));

    const safeProfile = {
      gamertag: account.gamertag || '',
      xuid: account.xuid || '',
      displayName: account.displayName || account.gamertag || '',
      gamerpic: account.gamerpic || '',
      gamerscore: account.gamerscore || '',
      provider: account.provider || 'Microsoft/Xbox',
      authenticated: true,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem('directive_minecraft_profile', JSON.stringify(safeProfile));
      sessionStorage.setItem('directive_minecraft_gamertag', safeProfile.gamertag);
      sessionStorage.setItem('directive_minecraft_xuid', safeProfile.xuid);
    } catch (_) {}

    window.setTimeout(fetchNetworkStats, 220);
    setTimeout(() => {
      closeLoginSheet();
      setTimeout(() => activatePanel(termsPanel, 1), 380);
    }, 520);
  });

  function showTermsConsent() {
    if (!termsConsent || !termsConsent.hidden) return;
    termsConsent.hidden = false;
    requestAnimationFrame(() => termsConsent.classList.add('is-visible'));
  }

  function unlockTermsConsent() {
    if (!termsReader || !termsConsent || !termsConsent.hidden) return;
    const remaining = termsReader.scrollHeight - termsReader.scrollTop - termsReader.clientHeight;
    if (remaining <= 110) showTermsConsent();
  }

  termsReader?.addEventListener('scroll', unlockTermsConsent, { passive: true });
  termsReader?.addEventListener('touchend', unlockTermsConsent, { passive: true });

  if (termsReader && readerEnd && 'IntersectionObserver' in window) {
    const endObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) showTermsConsent();
    }, { root: termsReader, threshold: 0.2, rootMargin: '0px 0px 80px 0px' });
    endObserver.observe(readerEnd);
  }

  setTimeout(unlockTermsConsent, 300);

  termsCheck?.addEventListener('change', () => {
    if (!termsCheck.checked) return;
    setTimeout(() => activatePanel(licensePanel, 1), 220);
  });

  licenseCheck?.addEventListener('change', () => {
    if (!faqPanel) return;
    if (licenseCheck.checked) {
      faqPanel.hidden = false;
      requestAnimationFrame(() => faqPanel.classList.add('is-visible'));
      setTimeout(() => faqPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 160);
    } else {
      faqPanel.classList.remove('is-visible');
      setTimeout(() => { faqPanel.hidden = true; }, 320);
    }
  });

  nextButton?.addEventListener('click', () => {
    if (!licenseCheck?.checked) return;

    storage.set('directive_onboarding_complete', '1');
    try { sessionStorage.setItem('directive_home_entry', '1'); } catch (_) {}

    transition.classList.add('is-closing');
    setTimeout(() => { window.location.href = 'index.html'; }, 980);
  });
})();
