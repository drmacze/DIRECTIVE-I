(() => {
  const PHRASE = /DIRECTIVE\s+I(?!I)/gi;
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','CANVAS','TEXTAREA','OPTION']);

  const isInsideShiny = node => node.parentElement?.closest('.directive-shiny-text,.directive-shiny-split');

  const decorateTextNode = node => {
    if (!node?.nodeValue || !/DIRECTIVE\s+I(?!I)/i.test(node.nodeValue)) return;
    const parent = node.parentElement;
    if (!parent || SKIP.has(parent.tagName) || isInsideShiny(node)) return;

    const text = node.nodeValue;
    PHRASE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let match;

    while ((match = PHRASE.exec(text))) {
      if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      const span = document.createElement('span');
      span.className = 'directive-shiny-text';
      span.textContent = match[0];
      frag.appendChild(span);
      last = match.index + match[0].length;
    }

    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.replaceWith(frag);
  };

  const decorateRoot = root => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      decorateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || SKIP.has(parent.tagName) || isInsideShiny(node)) return NodeFilter.FILTER_REJECT;
        return /DIRECTIVE\s+I(?!I)/i.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(decorateTextNode);
  };

  const decorateSplitBranding = () => {
    const regular = [
      '.brand .brand-word',
      '#hero-title > span',
      '.welcome-brand > span',
      '.directive-word',
      '.auth-card .brand > span'
    ];
    const marks = [
      '.brand .brand-mark',
      '#hero-title > strong',
      '.welcome-brand > b',
      '.directive-mark',
      '.auth-card .brand > b'
    ];

    document.querySelectorAll(regular.join(',')).forEach(el => el.classList.add('directive-shiny-split'));
    document.querySelectorAll(marks.join(',')).forEach(el => el.classList.add('directive-shiny-split','directive-shiny-mark'));
  };

  const run = root => {
    decorateSplitBranding();
    decorateRoot(root || document.body);
  };

  const start = () => {
    run(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') decorateTextNode(record.target);
        record.addedNodes?.forEach(node => run(node));
      }
    });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
    window.setTimeout(() => observer.disconnect(), 20000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
