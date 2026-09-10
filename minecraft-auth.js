(() => {
  if (!document.querySelector('script[data-directive-official-branding]')) {
    const branding = document.createElement('script');
    branding.src = 'official-branding.js?v=1';
    branding.dataset.directiveOfficialBranding = '';
    branding.defer = true;
    document.head.appendChild(branding);
  }

  const button = document.querySelector('[data-minecraft-login]');
  const status = document.querySelector('[data-minecraft-auth-status]');
  const profile = document.querySelector('[data-minecraft-profile]');
  const gamertag = document.querySelector('[data-minecraft-gamertag]');
  const profileMeta = document.querySelector('[data-minecraft-profile-meta]');
  if (!button) return;

  const CLIENT_ID = '8d96f158-bac2-4305-856f-fe6be31b2404';
  const REDIRECT_URI = 'https://drmacze.github.io/DIRECTIVE-I/auth-callback.html';
  const AUTHORIZE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('is-error', 'is-ready');
    if (state) status.classList.add(`is-${state}`);
  };

  const completeAuth = (account) => {
    const safeAccount = {
      gamertag: account?.gamertag || '',
      xuid: account?.xuid || '',
      displayName: account?.displayName || '',
      gamerpic: account?.gamerpic || '',
      gamerscore: account?.gamerscore || '',
      provider: account?.provider || 'Microsoft/Xbox',
      authenticated: true,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem('directive_minecraft_profile', JSON.stringify(safeAccount));
    } catch (_) {}

    if (gamertag) gamertag.textContent = safeAccount.gamertag || 'Minecraft account connected';
    if (profileMeta) {
      const suffix = safeAccount.xuid ? ` · XUID ${safeAccount.xuid}` : '';
      profileMeta.textContent = `Xbox profile verified${suffix}`;
    }
    profile?.removeAttribute('hidden');
    setStatus('Minecraft identity verified. Continuing secure onboarding…', 'ready');

    window.dispatchEvent(new CustomEvent('directive:minecraft-authenticated', { detail: safeAccount }));
  };

  try {
    const returned = sessionStorage.getItem('directive_minecraft_account');
    if (returned) {
      sessionStorage.removeItem('directive_minecraft_account');
      const parsed = JSON.parse(returned);
      button.disabled = true;
      completeAuth(parsed);
      return;
    }
  } catch (_) {}

  button.addEventListener('click', async () => {
    if (button.disabled) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') {
      button.disabled = true;
      setStatus('Previewing verified Minecraft identity…');
      setTimeout(() => completeAuth({ gamertag: 'Developer Preview', xuid: '', provider: 'Preview' }), 650);
      return;
    }

    button.disabled = true;
    setStatus('Opening Microsoft secure sign-in…');

    try {
      const stateBytes = new Uint8Array(24);
      crypto.getRandomValues(stateBytes);
      const state = Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem('directive_microsoft_oauth_state', state);

      const auth = new URL(AUTHORIZE_URL);
      auth.searchParams.set('client_id', CLIENT_ID);
      auth.searchParams.set('response_type', 'code');
      auth.searchParams.set('redirect_uri', REDIRECT_URI);
      auth.searchParams.set('response_mode', 'query');
      auth.searchParams.set('scope', 'xboxlive.signin xboxlive.offline_access');
      auth.searchParams.set('state', state);
      auth.searchParams.set('prompt', 'select_account');

      window.location.assign(auth.toString());
    } catch (error) {
      setStatus(error?.message || 'Could not start Microsoft sign-in. Please try again.', 'error');
      button.disabled = false;
    }
  });
})();
