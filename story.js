(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const revealItems = Array.from(document.querySelectorAll('[data-story-reveal]'));
  const timeline = document.querySelector('[data-season-timeline]');
  const detail = document.querySelector('[data-season-detail="1"]');
  const detailScroll = document.querySelector('[data-season-detail-scroll]');
  const transition = document.querySelector('[data-story-transition]');
  const openSeason = document.querySelector('[data-open-season="1"]');
  const closeSeasonButtons = Array.from(document.querySelectorAll('[data-close-season]'));
  let detailOpen = false;
  let transitioning = false;
  let savedScrollY = 0;

  revealItems.forEach((element, index) => {
    if (!element.style.getPropertyValue('--story-delay')) {
      element.style.setProperty('--story-delay', `${Math.min(index * 65, 260)}ms`);
    }
  });

  document.body.classList.add('story-fx-ready');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(element => element.classList.add('is-story-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-story-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(element => observer.observe(element));
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateTimeline = () => {
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const start = viewport * .66;
    const end = viewport * .24;
    const span = Math.max(1, rect.height + start - end);
    const progress = clamp((start - rect.top) / span, 0, 1);
    timeline.style.setProperty('--timeline-progress', `${(progress * 100).toFixed(2)}%`);
  };

  updateTimeline();
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline, { passive: true });

  const showSeasonReveal = () => {
    const items = Array.from(detail?.querySelectorAll('[data-season-reveal]') || []);
    items.forEach(item => item.classList.remove('is-season-visible'));
    if (reduceMotion) {
      items.forEach(item => item.classList.add('is-season-visible'));
      return;
    }
    items.forEach((item, index) => {
      window.setTimeout(() => item.classList.add('is-season-visible'), 90 + Math.min(index * 75, 520));
    });
  };

  const runShutters = async (middle) => {
    if (!transition) {
      middle?.();
      return;
    }
    transitioning = true;
    transition.className = 'story-transition is-animating is-covering';
    await new Promise(resolve => setTimeout(resolve, reduceMotion ? 20 : 760));
    middle?.();
    transition.className = 'story-transition is-animating is-uncovering';
    await new Promise(resolve => setTimeout(resolve, reduceMotion ? 20 : 760));
    transition.className = 'story-transition';
    transitioning = false;
  };

  const openDetail = async () => {
    if (!detail || detailOpen || transitioning) return;
    savedScrollY = window.scrollY;
    await runShutters(() => {
      detailOpen = true;
      document.body.classList.add('season-detail-open');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      detail.classList.add('is-active');
      detail.setAttribute('aria-hidden', 'false');
      if (detailScroll) detailScroll.scrollTop = 0;
      showSeasonReveal();
      try { history.pushState({ directiveSeason: 1 }, '', '#season-1'); } catch (_) {}
    });
    window.setTimeout(() => detail.querySelector('[data-close-season]')?.focus({ preventScroll: true }), 40);
  };

  const closeDetail = async ({ historyBack = false } = {}) => {
    if (!detail || !detailOpen || transitioning) return;
    await runShutters(() => {
      detailOpen = false;
      detail.classList.remove('is-active');
      detail.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('season-detail-open');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
      if (!historyBack) {
        try { history.replaceState({ directiveSeason: null }, '', location.pathname + location.search + '#seasons'); } catch (_) {}
      }
    });
    window.setTimeout(() => openSeason?.focus({ preventScroll: true }), 40);
  };

  openSeason?.addEventListener('click', openDetail);
  closeSeasonButtons.forEach(button => button.addEventListener('click', () => closeDetail()));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && detailOpen) {
      event.preventDefault();
      closeDetail();
    }
  });

  window.addEventListener('popstate', () => {
    const wantsSeason = location.hash === '#season-1';
    if (wantsSeason && !detailOpen) openDetail();
    else if (!wantsSeason && detailOpen) closeDetail({ historyBack: true });
  });

  if (location.hash === '#season-1') {
    window.setTimeout(openDetail, 80);
  }

  function easeInOutCubic(t) {
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothTo(targetY, duration = 900) {
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    const startY = window.scrollY;
    const distance = targetY - startY;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#season-1') return;
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
