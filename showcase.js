(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('[data-model-stage]');
  const empty = document.querySelector('[data-model-empty]');
  const modelSrc = document.body.dataset.showcaseModel || '';

  if (modelSrc && stage) {
    const loader = document.createElement('script');
    loader.type = 'module';
    loader.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    loader.onload = () => {
      const viewer = document.createElement('model-viewer');
      viewer.src = modelSrc;
      viewer.alt = 'DIRECTIVE I 3D showcase model';
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('touch-action', 'pan-y');
      viewer.setAttribute('shadow-intensity', '1');
      viewer.setAttribute('environment-image', 'neutral');
      viewer.setAttribute('interaction-prompt', 'auto');
      if (!reduceMotion) viewer.setAttribute('auto-rotate', '');
      stage.appendChild(viewer);
      empty?.remove();
    };
    document.head.appendChild(loader);
  }

  const revealNodes = Array.from(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });

  revealNodes.forEach((node) => observer.observe(node));
})();
