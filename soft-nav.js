(() => {
  if (window.top !== window.self) return;

  const ensureRequirementsNavigation = () => {
    document.querySelectorAll('.desktop-nav, .mobile-menu nav').forEach(nav => {
      if (nav.querySelector('a[href="requirements.html"]')) return;
      const link = document.createElement('a');
      link.href = 'requirements.html';
      link.textContent = 'Requirements';
      const documentation = nav.querySelector('a[href="documentation.html"]');
      if (documentation?.nextSibling) nav.insertBefore(link, documentation.nextSibling);
      else nav.appendChild(link);
      if (nav.closest('.mobile-menu')) link.addEventListener('click', closeMenu);
    });

    if (!document.querySelector('script[src^="site-analytics.js"]')) {
      const analytics = document.createElement('script');
      analytics.src = 'site-analytics.js?v=2';
      document.body.appendChild(analytics);
    }

    const style = document.createElement('style');
    style.textContent = '@media(min-width:901px){.desktop-nav{gap:clamp(18px,2vw,30px)}}';
    document.head.appendChild(style);
  };

  const STORY_PATH = 'story.html';
  let frame = null;
  let previousOverflow = '';

  const isStoryHref = anchor => {
    if (!anchor || !anchor.href) return false;
    try {
      const url = new URL(anchor.href, location.href);
      return url.origin === location.origin && /\/DIRECTIVE-I\/story\.html$/.test(url.pathname);
    } catch (_) {
      return false;
    }
  };

  const setHomeUrl = ({ replace = false } = {}) => {
    const url = new URL('index.html', location.href);
    const method = replace ? 'replaceState' : 'pushState';
    try { history[method]({ directiveSoftPage: 'home' }, '', url.pathname + url.search + url.hash); } catch (_) {}
  };

  const closeStory = ({ updateHistory = true } = {}) => {
    if (!frame) return;
    const current = frame;
    frame = null;
    current.classList.add('is-leaving');
    setTimeout(() => current.remove(), 720);
    document.documentElement.style.overflow = previousOverflow;
    document.body.style.overflow = previousOverflow;
    if (updateHistory) setHomeUrl();
  };

  const wireFrame = iframe => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.addEventListener('click', event => {
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;
        let url;
        try { url = new URL(anchor.href, iframe.contentWindow.location.href); } catch (_) { return; }
        const isHome = url.origin === location.origin && /\/DIRECTIVE-I\/(?:index\.html)?$/.test(url.pathname);
        if (!isHome) return;
        event.preventDefault();
        closeStory({ updateHistory: true });
      });
    } catch (_) {}
  };

  const openStory = ({ updateHistory = true } = {}) => {
    if (frame) return;
    previousOverflow = document.documentElement.style.overflow || '';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const iframe = document.createElement('iframe');
    iframe.className = 'directive-soft-story';
    iframe.src = 'story.html?embedded=1';
    iframe.title = 'DIRECTIVE I Main Story';
    iframe.setAttribute('allow', 'autoplay');
    iframe.style.cssText = [
      'position:fixed','inset:0','width:100%','height:100dvh','min-height:100vh','border:0','background:#070909','z-index:6400','opacity:0','transform:translate3d(3.5%,0,0)','filter:blur(7px)','transition:opacity .72s ease,transform .92s cubic-bezier(.16,1,.3,1),filter .72s ease'
    ].join(';');
    frame = iframe;
    document.body.appendChild(iframe);

    iframe.addEventListener('load', () => {
      wireFrame(iframe);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        iframe.style.opacity = '1';
        iframe.style.transform = 'translate3d(0,0,0)';
        iframe.style.filter = 'blur(0)';
      }));
    });

    if (updateHistory) {
      try { history.pushState({ directiveSoftPage: 'story' }, '', STORY_PATH); } catch (_) {}
    }
  };

  const style = document.createElement('style');
  style.textContent = '.directive-soft-story.is-leaving{opacity:0!important;transform:translate3d(-3.5%,0,0)!important;filter:blur(7px)!important;pointer-events:none!important}';
  document.head.appendChild(style);

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!isStoryHref(anchor)) return;
    event.preventDefault();
    openStory({ updateHistory: true });
  });

  window.addEventListener('popstate', () => {
    const story = /\/story\.html$/.test(location.pathname);
    if (story) openStory({ updateHistory: false });
    else closeStory({ updateHistory: false });
  });

  ensureRequirementsNavigation();
})();