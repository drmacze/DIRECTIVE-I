(() => {
  if (!document.querySelector('link[href*="cookie.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'cookie.css?v=1';
    document.head.appendChild(css);
  }

  if (!document.querySelector('[data-cookie-dock]')) {
    const ui = document.createElement('div');
    ui.innerHTML = `
      <div class="cookie-backdrop" data-cookie-backdrop hidden></div>

      <aside class="cookie-dock" data-cookie-dock hidden aria-label="Cookie consent">
        <div class="cookie-card">
          <div class="cookie-copy">
            <p class="cookie-signal"><i aria-hidden="true"></i> Privacy signal detected</p>
            <h2 class="cookie-title">Visitor clearance required.</h2>
            <p class="cookie-text">DIRECTIVE I uses one <strong>essential consent cookie</strong> to remember your choice. Optional analytics and personalization remain inactive unless you authorize them.</p>
          </div>
          <div class="cookie-actions">
            <button class="cookie-btn cookie-btn-primary" type="button" data-cookie-accept-all>Authorize all</button>
            <button class="cookie-btn" type="button" data-cookie-reject-optional>Essential only</button>
            <button class="cookie-btn" type="button" data-cookie-settings>Configure</button>
          </div>
        </div>
      </aside>

      <section class="cookie-panel" data-cookie-panel hidden aria-hidden="true" aria-labelledby="cookie-panel-title">
        <div class="cookie-panel-header">
          <div>
            <p class="cookie-panel-kicker">Privacy protocol // clearance matrix</p>
            <h2 id="cookie-panel-title">Cookie settings</h2>
          </div>
          <button class="cookie-close" type="button" data-cookie-close aria-label="Close cookie settings">×</button>
        </div>

        <div class="cookie-panel-body">
          <p class="cookie-panel-intro">Choose which optional systems may operate on this site. Your selection is stored for 180 days and can be changed at any time from the footer.</p>

          <div class="cookie-option">
            <div>
              <h3>Essential systems</h3>
              <p>Required for remembering your privacy choice and maintaining core site behavior.</p>
              <span class="cookie-status">Status // always active</span>
            </div>
            <label class="cookie-toggle" aria-label="Essential cookies always enabled">
              <input type="checkbox" checked disabled />
              <span></span>
            </label>
          </div>

          <div class="cookie-option">
            <div>
              <h3>Anonymous analytics</h3>
              <p>Allows future privacy-respecting measurement of visits and page performance. No analytics script is activated unless this category is authorized.</p>
              <span class="cookie-status">Status // optional</span>
            </div>
            <label class="cookie-toggle" aria-label="Allow analytics cookies">
              <input type="checkbox" data-cookie-analytics />
              <span></span>
            </label>
          </div>

          <div class="cookie-option">
            <div>
              <h3>Personalization</h3>
              <p>Allows future site preferences and tailored presentation to persist between sessions.</p>
              <span class="cookie-status">Status // optional</span>
            </div>
            <label class="cookie-toggle" aria-label="Allow personalization cookies">
              <input type="checkbox" data-cookie-personalization />
              <span></span>
            </label>
          </div>
        </div>

        <div class="cookie-panel-actions">
          <button class="cookie-btn" type="button" data-cookie-save>Save clearance</button>
          <button class="cookie-btn cookie-btn-primary" type="button" data-cookie-panel-accept-all>Authorize all</button>
        </div>
      </section>
    `;

    while (ui.firstElementChild) document.body.appendChild(ui.firstElementChild);

    const footerGrid = document.querySelector('.footer-grid');
    if (footerGrid && !footerGrid.querySelector('[data-cookie-settings]')) {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'cookie-settings-trigger';
      trigger.setAttribute('data-cookie-settings', '');
      trigger.textContent = 'Cookie settings';
      footerGrid.appendChild(trigger);
    }
  }

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
