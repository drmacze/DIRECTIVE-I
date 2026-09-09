(() => {
  const params = new URLSearchParams(window.location.search);
  let shouldReveal = params.get('logout') === '1';

  try {
    shouldReveal = shouldReveal || sessionStorage.getItem('directive_logout_reveal') === '1';
    sessionStorage.removeItem('directive_logout_reveal');
  } catch (_) {}

  if (!shouldReveal) return;

  const transition = document.querySelector('[data-portal-transition]');
  if (!transition) return;

  const panels = transition.querySelectorAll('i');
  panels.forEach((panel) => { panel.style.transition = 'none'; });
  transition.classList.add('is-closing');

  // Force the fully closed black frame before revealing the welcome screen.
  void transition.offsetWidth;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    panels.forEach((panel) => { panel.style.transition = ''; });
    transition.classList.remove('is-closing');
  }));

  window.setTimeout(() => {
    try {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('logout');
      clean.searchParams.delete('v');
      history.replaceState(null, '', clean.pathname + (clean.search ? clean.search : '') + clean.hash);
    } catch (_) {}
  }, 1050);
})();
