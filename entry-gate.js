(() => {
  let completed = false;
  try { completed = localStorage.getItem('directive_onboarding_complete') === '1'; } catch (_) {}

  if (!completed) {
    const target = new URL('welcome.html', window.location.href);
    window.location.replace(target.href);
    return;
  }

  let shouldAnimate = false;
  try {
    shouldAnimate = sessionStorage.getItem('directive_home_entry') === '1';
    if (shouldAnimate) sessionStorage.removeItem('directive_home_entry');
  } catch (_) {}

  if (!shouldAnimate) return;

  const style = document.createElement('style');
  style.textContent = `
    .directive-entry-transition{position:fixed;inset:0;z-index:99999;pointer-events:none}
    .directive-entry-transition i{position:absolute;display:block;background:#000;transition:transform .95s cubic-bezier(.7,0,.2,1)}
    .directive-entry-transition .t{top:0;left:0;right:0;height:50%;transform:translateY(0)}
    .directive-entry-transition .b{bottom:0;left:0;right:0;height:50%;transform:translateY(0)}
    .directive-entry-transition .l{left:0;top:0;bottom:0;width:50%;transform:translateX(0)}
    .directive-entry-transition .r{right:0;top:0;bottom:0;width:50%;transform:translateX(0)}
    .directive-entry-transition.is-opening .t{transform:translateY(-101%)}
    .directive-entry-transition.is-opening .b{transform:translateY(101%)}
    .directive-entry-transition.is-opening .l{transform:translateX(-101%)}
    .directive-entry-transition.is-opening .r{transform:translateX(101%)}
    @media(prefers-reduced-motion:reduce){.directive-entry-transition i{transition-duration:.01ms}}
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.createElement('div');
    overlay.className = 'directive-entry-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<i class="t"></i><i class="r"></i><i class="b"></i><i class="l"></i>';
    document.body.appendChild(overlay);

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-opening')));
    setTimeout(() => overlay.remove(), 1100);
  }, { once: true });
})();
