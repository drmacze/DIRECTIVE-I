(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-showcase';
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const modelTrack=document.querySelector('[data-model-track]');
  const frameTrack=document.querySelector('[data-frame-grid]');
  const itemTrack=document.querySelector('[data-item-grid]');
  let modelViewerLoaded=false;
  const sliderState=new Map();

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

  function loadModelViewer(){
    if(modelViewerLoaded||customElements.get('model-viewer')){modelViewerLoaded=true;return Promise.resolve(true)}
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.type='module';
      s.src='https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      s.onload=()=>{modelViewerLoaded=true;resolve(true)};
      s.onerror=()=>resolve(false);
      document.head.appendChild(s);
    });
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
        const gap=parseFloat(getComputedStyle(root.querySelector('.showcase-track')).gap||'0')||0;
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
      new MutationObserver(()=>requestAnimationFrame(()=>updateSlider(name))).observe(root.querySelector('.showcase-track'),{childList:true});
      updateSlider(name);
    });
    window.addEventListener('resize',()=>sliderState.forEach((_,name)=>updateSlider(name)),{passive:true});
  }

  async function renderModels(models){
    if(!modelTrack)return;
    modelTrack.replaceChildren();
    if(!models.length){empty(modelTrack,'3D MODEL ARCHIVE');updateSlider('models');return}
    const viewerReady=await loadModelViewer();
    models.forEach((entry,index)=>{
      const card=document.createElement('article');
      card.className='model-card';
      card.dataset.entryId=entry.id||'';

      const media=document.createElement('div');
      media.className='model-card-view';
      if(viewerReady&&customElements.get('model-viewer')){
        const viewer=document.createElement('model-viewer');
        viewer.src=entry.asset_url;
        viewer.alt=entry.description||entry.title||'DIRECTIVE I 3D model';
        viewer.setAttribute('camera-controls','');
        viewer.setAttribute('touch-action','pan-y');
        viewer.setAttribute('shadow-intensity','1');
        viewer.setAttribute('environment-image','neutral');
        viewer.setAttribute('interaction-prompt','auto');
        viewer.setAttribute('loading','lazy');
        viewer.setAttribute('reveal','auto');
        if(entry.thumbnail_url)viewer.setAttribute('poster',entry.thumbnail_url);
        if(!reduceMotion)viewer.setAttribute('auto-rotate','');
        viewer.addEventListener('pointerdown',()=>window.DIRECTIVE_ANALYTICS?.track?.('showcase_model_view',{id:entry.id,title:entry.title}),{once:true});
        media.appendChild(viewer);
      }else{
        const fallback=document.createElement('div');
        fallback.className='slider-empty';
        fallback.innerHTML='<div><strong>3D VIEWER</strong><span>Viewer unavailable on this device.</span></div>';
        media.appendChild(fallback);
      }

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
      modelTrack.appendChild(card);
    });
    updateSlider('models');
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
      const res=await fetch(ENDPOINT,{headers:{Accept:'application/json'}});
      const data=await res.json();
      if(!res.ok||!data?.ok)throw new Error('showcase unavailable');
      const entries=Array.isArray(data.entries)?data.entries:[];
      await renderModels(entries.filter(x=>x.kind==='model'));
      renderImages(entries.filter(x=>x.kind==='image'));
      renderItems(entries.filter(x=>x.kind==='item'));
    }catch(_){
      await renderModels([]);
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