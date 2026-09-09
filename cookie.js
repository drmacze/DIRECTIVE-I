(() => {
  const CONSENT_COOKIE = 'directive_cookie_clearance';
  const MAX_AGE = 60 * 60 * 24 * 180;

  const dock = document.querySelector('[data-cookie-dock]');
  const backdrop = document.querySelector('[data-cookie-backdrop]');
  const panel = document.querySelector('[data-cookie-panel]');
  const settingsButtons = document.querySelectorAll('[data-cookie-settings]');
  const closeButton = document.querySelector('[data-cookie-close]');
  const acceptAllButton = document.querySelector('[data-cookie-accept-all]');
  const rejectOptionalButton = document.querySelector('[data-cookie-reject-optional]');
  const saveButton = document.querySelector('[data-cookie-save]');
  const panelAcceptAllButton = document.querySelector('[data-cookie-panel-accept-all]');
  const analyticsToggle = document.querySelector('[data-cookie-analytics]');
  const personalizationToggle = document.querySelector('[data-cookie-personalization]');

  if (!dock || !panel || !backdrop) return;

  const defaults = {
    necessary: true,
    analytics: false,
    personalization: false,
    version: 1
  };

  function readConsent() {
    const prefix = `${CONSENT_COOKIE}=`;
    const raw = document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix));

    if (!raw) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(raw.slice(prefix.length)));
      return { ...defaults, ...parsed, necessary: true };
    } catch (_) {
      return null;
    }
  }

  function writeConsent(next) {
    const value = {
      ...defaults,
      ...next,
      necessary: true,
      updatedAt: new Date().toISOString()
    };

    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax; Secure`;
    window.dispatchEvent(new CustomEvent('directive:consentchange', { detail: value }));
    return value;
  }

  function syncToggles(value) {
    if (analyticsToggle) analyticsToggle.checked = Boolean(value?.analytics);
    if (personalizationToggle) personalizationToggle.checked = Boolean(value?.personalization);
  }

  function showDock() {
    dock.hidden = false;
    requestAnimationFrame(() => dock.classList.add('is-visible'));
  }

  function hideDock() {
    dock.classList.remove('is-visible');
    window.setTimeout(() => { dock.hidden = true; }, 500);
  }

  function openPanel() {
    syncToggles(readConsent() || defaults);
    backdrop.hidden = false;
    panel.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add('is-visible');
      panel.classList.add('is-visible');
    });
    panel.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => closeButton?.focus(), 120);
  }

  function closePanel() {
    backdrop.classList.remove('is-visible');
    panel.classList.remove('is-visible');
    panel.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      backdrop.hidden = true;
      panel.hidden = true;
    }, 320);
  }

  function commit(value) {
    writeConsent(value);
    hideDock();
    closePanel();
  }

  acceptAllButton?.addEventListener('click', () => commit({ analytics: true, personalization: true }));
  panelAcceptAllButton?.addEventListener('click', () => commit({ analytics: true, personalization: true }));
  rejectOptionalButton?.addEventListener('click', () => commit({ analytics: false, personalization: false }));

  saveButton?.addEventListener('click', () => {
    commit({
      analytics: Boolean(analyticsToggle?.checked),
      personalization: Boolean(personalizationToggle?.checked)
    });
  });

  settingsButtons.forEach((button) => button.addEventListener('click', openPanel));
  closeButton?.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-visible')) closePanel();
  });

  const consent = readConsent();
  syncToggles(consent || defaults);

  if (!consent) {
    window.setTimeout(showDock, 650);
  } else {
    dock.hidden = true;
  }
})();
