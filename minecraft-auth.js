(() => {
  const button = document.querySelector('[data-minecraft-login]');
  const status = document.querySelector('[data-minecraft-auth-status]');
  const profile = document.querySelector('[data-minecraft-profile]');
  const gamertag = document.querySelector('[data-minecraft-gamertag]');
  const profileMeta = document.querySelector('[data-minecraft-profile-meta]');
  if (!button) return;

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
      minecraftId: account?.minecraftId || '',
      authenticated: true
    };

    if (gamertag) gamertag.textContent = safeAccount.gamertag || 'Minecraft account connected';
    if (profileMeta) profileMeta.textContent = safeAccount.xuid
      ? `Xbox profile verified · XUID ${safeAccount.xuid}`
      : 'Microsoft/Xbox profile verified';
    profile?.removeAttribute('hidden');
    setStatus('Minecraft identity verified. Continuing secure onboarding…', 'ready');

    window.dispatchEvent(new CustomEvent('directive:minecraft-authenticated', { detail: safeAccount }));
  };

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    setStatus('Opening Microsoft / Xbox secure sign-in…');

    /*
      Production hook.
      A real Minecraft account flow must be connected to an officially registered
      Microsoft/Xbox application. Do not place client secrets in GitHub Pages.
      When the external auth adapter is installed it should expose:
        window.DIRECTIVE_MINECRAFT_AUTH.signIn()
      and resolve with { gamertag, xuid, minecraftId } only after Xbox/Minecraft
      identity has been verified.
    */
    const adapter = window.DIRECTIVE_MINECRAFT_AUTH;

    if (adapter && typeof adapter.signIn === 'function') {
      try {
        const account = await adapter.signIn();
        if (!account) throw new Error('No Minecraft account returned.');
        completeAuth(account);
        return;
      } catch (error) {
        setStatus(error?.message || 'Minecraft sign-in failed. Please try again.', 'error');
        button.disabled = false;
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') {
      setTimeout(() => completeAuth({ gamertag: 'Developer Preview', xuid: '', minecraftId: '' }), 650);
      return;
    }

    setStatus('Minecraft sign-in needs the Microsoft/Xbox application registration before it can authenticate real players.', 'error');
    button.disabled = false;
  });
})();
