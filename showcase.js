(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-showcase';
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const modelTrack=document.querySelector('[data-model-track]');
  const frameTrack=document.querySelector('[data-frame-grid]');
  const itemTrack=document.querySelector('[data-item-grid]');
  const sliderState=new Map();
  let modelViewerPromise=null;

  const empty=(root,title,copy='Content will appear here when published from the developer console.')=>{
    if(!root)return;
    root.replaceChildren();
    const card=document.createElement('div');
    card.className='slider-empty';
    const wrap=document.createElement('div');
    const strong=document.createElement('strong');
    strong.textContent=title;
    const span=document.createElement('span');
    span.textContent=copy;
    wrap.append(strong,span);
    card.appendChild(wrap);
    root.appendChild(card);
  };

  function loadModule(src,timeout=9000){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[data-model-viewer-src="${src}"]`);
      if(existing){
        if(customElements.get('model-viewer'))return resolve(true);
        existing.addEventListener('load',()=>resolve(true),{once:true});
        existing.addEventListener('error',()=>reject(new Error('MODEL_VIEWER_SCRIPT_FAILED')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.type='module';
      script.src=src;
      script.dataset.modelViewerSrc=src;
      const timer=setTimeout(()=>reject(new Error('MODEL_VIEWER_TIMEOUT')),timeout);
      script.onload=()=>{clearTimeout(timer);resolve(true)};
      script.onerror=()=>{clearTimeout(timer);reject(new Error('MODEL_VIEWER_SCRIPT_FAILED'))};
      document.head.appendChild(script);
    });
  }

  function ensureModelViewer(){
    if(customElements.get('model-viewer'))return Promise.resolve(true);
    if(modelViewerPromise)return modelViewerPromise;
    modelViewerPromise=(async()=>{
      const sources=[
        'https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js',
        'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
      ];
      for(const src of sources){
        try{
          await loadModule(src);
          if(customElements.get('model-viewer'))return true;
          await Promise.race([
            customElements.whenDefined('model-viewer'),
            new Promise((_,reject)=>setTimeout(()=>reject(new Error('MODEL_VIEWER_DEFINE_TIMEOUT')),4000))
          ]);
          if(customElements.get('model-viewer'))return true;
        }catch(_){ }
      }
      return false;
    })();
    return modelViewerPromise;
  }

  function updateSlider(name){
    const state=sliderState.get(name);
    if(!state)return;
    const {root,prev,next}=state;
    const max=Math.max(0,root.scrollWidth-root.clientWidth);
    prev.disabled=root.scrollLeft<=3;
    next.disabled=max<=3||root.scrollLeft>=max-3;
  }

  function setupSliders(){
    document.querySelectorAll('[data-slider]').forEach(root=>{
      const name=root.dataset.slider;
      const prev=document.querySelector(`[data-slider-prev="${name}"]`);
      const next=document.querySelector(`[data-slider-next="${name}"]`);
      if(!prev||!next)return;
      sliderState.set(name,{root,prev,next});
      const step=direction=>{
        const first=root.querySelector('.showcase-track > *');
        const track=root.querySelector('.showcase-track');
        const gap=parseFloat(track?getComputedStyle(track).gap:'0')||0;
        const amount=(first?.getBoundingClientRect().width||root.clientWidth*.82)+gap;
        root.scrollBy({left:amount*direction,behavior:reduceMotion?'auto':'smooth'});
      };
      prev.addEventListener('click',()=>step(-1));
      next.addEventListener('click',()=>step(1));
      let raf=0;
      root.addEventListener('scroll',()=>{
        cancelAnimationFrame(raf);
        raf=requestAnimationFrame(()=>updateSlider(name));
      },{passive:true});
      const track=root.querySelector('.showcase-track');
      if(track)new MutationObserver(()=>requestAnimationFrame(()=>updateSlider(name))).observe(track,{childList:true});
      updateSlider(name);
    });
    window.addEventListener('resize',()=>sliderState.forEach((_,name)=>updateSlider(name)),{passive:true});
  }

  function createModelCard(entry,index){
    const card=document.createElement('article');
    card.className='model-card';
    card.dataset.entryId=entry.id||'';

    const media=document.createElement('div');
    media.className='model-card-view';

    const viewer=document.createElement('model-viewer');
    viewer.src=entry.asset_url;
    viewer.alt=entry.description||entry.title||'DIRECTIVE I 3D model';
    viewer.setAttribute('camera-controls','');
    viewer.setAttribute('touch-action','pan-y');
    viewer.setAttribute('shadow-intensity','1');
    viewer.setAttribute('environment-image','neutral');
    viewer.setAttribute('interaction-prompt','auto');
    viewer.setAttribute('loading','eager');
    viewer.setAttribute('reveal','auto');
    if(entry.thumbnail_url)viewer.setAttribute('poster',entry.thumbnail_url);
    if(!reduceMotion)viewer.setAttribute('auto-rotate','');

    const loading=document.createElement('div');
    loading.className='model-loading';
    const loadingStrong=document.createElement('strong');
    loadingStrong.textContent='LOADING 3D MODEL';
    const loadingText=document.createElement('span');
    loadingText.textContent='0%';
    loading.append(loadingStrong,loadingText);

    viewer.addEventListener('progress',event=>{
      const progress=Math.max(0,Math.min(1,Number(event?.detail?.totalProgress||0)));
      loadingText.textContent=`${Math.round(progress*100)}%`;
    });
    viewer.addEventListener('load',()=>{
      loading.classList.add('is-hidden');
      setTimeout(()=>loading.remove(),350);
    },{once:true});
    viewer.addEventListener('error',()=>{
      loading.classList.remove('is-hidden');
      loading.classList.add('is-error');
      loadingStrong.textContent='MODEL FAILED TO LOAD';
      loadingText.textContent='Tap reload or try again.';
    });
    viewer.addEventListener('pointerdown',()=>window.DIRECTIVE_ANALYTICS?.track?.('showcase_model_view',{id:entry.id,title:entry.title}),{once:true});

    media.append(viewer,loading);

    const copy=document.createElement('div');
    copy.className='model-card-copy';
    const titleWrap=document.createElement('div');
    const small=document.createElement('small');
    small.textContent=`MODEL ${String(index+1).padStart(2,'0')}`;
    const h3=document.createElement('h3');
    h3.textContent=entry.title||`Model ${index+1}`;
    titleWrap.append(small,h3);
    copy.appendChild(titleWrap);
    if(entry.subtitle||entry.description){
      const p=document.createElement('p');
      p.textContent=entry.subtitle||entry.description;
      copy.appendChild(p);
    }

    card.append(media,copy);
    return card;
  }

  function renderModels(models){
    if(!modelTrack)return;
    modelTrack.replaceChildren();
    if(!models.length){
      empty(modelTrack,'3D MODEL ARCHIVE');
      updateSlider('models');
      return;
    }

    models.forEach((entry,index)=>modelTrack.appendChild(createModelCard(entry,index)));
    updateSlider('models');

    ensureModelViewer().then(ready=>{
      if(ready)return;
      modelTrack.querySelectorAll('.model-loading').forEach(loading=>{
        loading.classList.add('is-error');
        const strong=loading.querySelector('strong');
        const span=loading.querySelector('span');
        if(strong)strong.textContent='3D VIEWER UNAVAILABLE';
        if(span)span.textContent='Viewer library could not be loaded.';
      });
    });
  }

  function renderImages(images){
    if(!frameTrack)return;
    frameTrack.replaceChildren();
    if(!images.length){empty(frameTrack,'PROJECT MEDIA ARCHIVE');updateSlider('frames');return}
    images.forEach((entry,index)=>{
      const figure=document.createElement('figure');
      figure.className='frame-card';
      const img=document.createElement('img');
      img.src=entry.asset_url;
      img.alt=entry.description||entry.title||'DIRECTIVE I project frame';
      img.loading='lazy';
      const caption=document.createElement('figcaption');
      const title=document.createElement('span');
      title.textContent=entry.title||'Project Frame';
      const number=document.createElement('span');
      number.textContent=String(index+1).padStart(2,'0');
      caption.append(title,number);
      figure.append(img,caption);
      frameTrack.appendChild(figure);
    });
    updateSlider('frames');
  }

  function renderItems(items){
    if(!itemTrack)return;
    itemTrack.replaceChildren();
    if(!items.length){empty(itemTrack,'ITEM ARCHIVE READY');updateSlider('items');return}
    items.forEach(entry=>{
      const card=document.createElement('article');
      card.className='item-card';
      const media=document.createElement('div');
      media.className='item-media';
      const img=document.createElement('img');
      img.src=entry.thumbnail_url||entry.asset_url;
      img.alt=entry.description||entry.title||'DIRECTIVE I project item';
      img.loading='lazy';
      media.appendChild(img);
      const copy=document.createElement('div');
      copy.className='item-copy';
      const small=document.createElement('small');
      small.textContent=entry.subtitle||'PROJECT ITEM';
      const h3=document.createElement('h3');
      h3.textContent=entry.title||'Unnamed item';
      copy.append(small,h3);
      if(entry.description){
        const p=document.createElement('p');
        p.textContent=entry.description;
        copy.appendChild(p);
      }
      card.append(media,copy);
      itemTrack.appendChild(card);
    });
    updateSlider('items');
  }

  async function load(){
    try{
      const url=`${ENDPOINT}?t=${Date.now()}`;
      const res=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await res.json();
      if(!res.ok||!data?.ok)throw new Error('showcase unavailable');
      const entries=Array.isArray(data.entries)?data.entries:[];
      renderModels(entries.filter(x=>x.kind==='model'));
      renderImages(entries.filter(x=>x.kind==='image'));
      renderItems(entries.filter(x=>x.kind==='item'));
    }catch(_){
      renderModels([]);
      if(frameTrack){
        frameTrack.innerHTML='<figure class="frame-card"><img src="assets/directive-i-hero-poster.jpg" alt="DIRECTIVE I cinematic project frame"><figcaption><span>World / Atmosphere</span><span>01</span></figcaption></figure><figure class="frame-card"><img src="assets/directive-i-trailer-poster.jpg" alt="DIRECTIVE I trailer project frame"><figcaption><span>Transmission / Scene</span><span>02</span></figcaption></figure>';
        updateSlider('frames');
      }
      renderItems([]);
    }
  }

  const revealNodes=Array.from(document.querySelectorAll('.reveal'));
  if(reduceMotion||!('IntersectionObserver'in window)){
    revealNodes.forEach(node=>node.classList.add('is-visible'));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -7% 0px'});
    revealNodes.forEach(node=>observer.observe(node));
  }

  setupSliders();
  load();
})();