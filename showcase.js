(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-showcase';
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||((navigator.platform==='MacIntel')&&navigator.maxTouchPoints>1);
  const MAX_ACTIVE_3D=isIOS?1:2;
  const modelTrack=document.querySelector('[data-model-track]');
  const frameTrack=document.querySelector('[data-frame-grid]');
  const itemTrack=document.querySelector('[data-item-grid]');
  const sliderState=new Map();
  const modelObjectUrls=new Map();
  const slots=new Map();
  const activeSlots=[];
  let modelViewerPromise=null;

  const meta=entry=>entry?.metadata&&typeof entry.metadata==='object'?entry.metadata:{};
  const getSketchfabUid=entry=>{
    const uid=String(meta(entry).sketchfab_uid||'').trim();
    return /^[a-f0-9]{32}$/i.test(uid)?uid:'';
  };
  const hasGlb=entry=>{
    const m=meta(entry);
    return Array.isArray(m.model_base64_parts)||typeof m.model_base64==='string'||m.embedded_model===true||/\.(glb|gltf)(?:[?#]|$)/i.test(entry?.asset_url||'');
  };
  const hasInteractiveModel=entry=>!!getSketchfabUid(entry)||hasGlb(entry);

  function empty(root,title,copy='Content will appear here when published from the developer console.'){
    if(!root)return;
    root.replaceChildren();
    const card=document.createElement('div');
    card.className='slider-empty';
    const wrap=document.createElement('div');
    const strong=document.createElement('strong');
    const span=document.createElement('span');
    strong.textContent=title;
    span.textContent=copy;
    wrap.append(strong,span);
    card.appendChild(wrap);
    root.appendChild(card);
  }

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
      for(const src of [
        'https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js',
        'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
      ]){
        try{
          await loadModule(src);
          if(customElements.get('model-viewer'))return true;
          await Promise.race([
            customElements.whenDefined('model-viewer'),
            new Promise((_,reject)=>setTimeout(()=>reject(new Error('MODEL_VIEWER_DEFINE_TIMEOUT')),3500))
          ]);
          if(customElements.get('model-viewer'))return true;
        }catch(_){ }
      }
      return false;
    })();
    return modelViewerPromise;
  }

  function decodeEmbeddedModel(entry){
    const id=String(entry?.id||entry?.title||Math.random());
    if(modelObjectUrls.has(id))return modelObjectUrls.get(id);
    const m=meta(entry);
    let encoded='';
    if(Array.isArray(m.model_base64_parts))encoded=m.model_base64_parts.join('');
    else if(typeof m.model_base64==='string')encoded=m.model_base64;
    if(!encoded)return entry?.asset_url||'';
    try{
      const raw=atob(encoded.replace(/\s+/g,''));
      const bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
      modelObjectUrls.set(id,url);
      return url;
    }catch(_){return entry?.asset_url||''}
  }

  function makeStatus(label){
    const loading=document.createElement('div');
    loading.className='model-loading';
    const strong=document.createElement('strong');
    const span=document.createElement('span');
    strong.textContent=`READY ${label}`;
    span.textContent='Slide into view to load';
    loading.append(strong,span);
    return {loading,strong,span};
  }
  function showStatus(slot,strongText,spanText,error=false){
    slot.loading.classList.remove('is-hidden','is-error');
    if(error)slot.loading.classList.add('is-error');
    slot.strong.textContent=strongText;
    slot.span.textContent=spanText;
  }
  function hideStatus(slot){slot.loading.classList.add('is-hidden')}

  function touchActive(slot){
    const i=activeSlots.indexOf(slot);
    if(i>=0)activeSlots.splice(i,1);
    activeSlots.push(slot);
    while(activeSlots.length>MAX_ACTIVE_3D){
      const victim=activeSlots.shift();
      if(victim&&victim!==slot)deactivateSlot(victim);
    }
  }

  function deactivateSlot(slot){
    if(!slot?.viewer)return;
    const viewer=slot.viewer;
    slot.viewer=null;
    slot.active=false;
    const i=activeSlots.indexOf(slot);
    if(i>=0)activeSlots.splice(i,1);
    try{
      if(viewer.tagName==='IFRAME')viewer.src='about:blank';
      else if(viewer.tagName==='MODEL-VIEWER')viewer.removeAttribute('src');
    }catch(_){ }
    viewer.remove();
    showStatus(slot,`READY ${slot.label}`,'Slide into view to load');
  }

  function createSketchfab(entry,slot){
    const iframe=document.createElement('iframe');
    iframe.className='source-model-viewer';
    iframe.title=entry.title||`DIRECTIVE I ${slot.label.toLowerCase()}`;
    iframe.allow='autoplay; fullscreen; xr-spatial-tracking';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    const params=new URLSearchParams({
      autostart:'1',preload:'0',ui_theme:'dark',ui_infos:'0',ui_help:'0',ui_settings:'0',
      ui_inspector:'0',ui_vr:'0',ui_ar:'0',ui_fullscreen:'0',ui_annotations:'0',
      ui_watermark:'0',ui_watermark_link:'0',ui_stop:'0',ui_hint:'0',dnt:'1'
    });
    iframe.src=`https://sketchfab.com/models/${getSketchfabUid(entry)}/embed?${params}`;
    iframe.addEventListener('load',()=>{
      if(slot.viewer===iframe)hideStatus(slot);
    },{once:true});
    return iframe;
  }

  async function createGlb(entry,slot){
    const ready=await ensureModelViewer();
    if(!ready)throw new Error('VIEWER_UNAVAILABLE');
    if(!slot.active)return null;
    const viewer=document.createElement('model-viewer');
    viewer.src=decodeEmbeddedModel(entry);
    viewer.alt=entry.description||entry.title||`DIRECTIVE I ${slot.label.toLowerCase()} model`;
    viewer.setAttribute('camera-controls','');
    viewer.setAttribute('touch-action','pan-y');
    viewer.setAttribute('shadow-intensity','1.15');
    viewer.setAttribute('environment-image','neutral');
    viewer.setAttribute('interaction-prompt','none');
    viewer.setAttribute('loading','eager');
    viewer.setAttribute('reveal','auto');
    viewer.setAttribute('camera-orbit','35deg 67deg auto');
    viewer.setAttribute('field-of-view','30deg');
    if(entry.thumbnail_url)viewer.setAttribute('poster',entry.thumbnail_url);
    viewer.addEventListener('progress',event=>{
      if(slot.viewer!==viewer)return;
      const p=Math.max(0,Math.min(1,Number(event?.detail?.totalProgress||0)));
      slot.span.textContent=`${Math.round(p*100)}%`;
    });
    viewer.addEventListener('load',()=>{if(slot.viewer===viewer)hideStatus(slot)},{once:true});
    viewer.addEventListener('error',()=>{
      if(slot.viewer===viewer)showStatus(slot,`${slot.label} FAILED TO LOAD`,'Swipe away and back to retry',true);
    });
    return viewer;
  }

  async function activateSlot(slot){
    if(!slot||slot.active||slot.activating)return;
    slot.active=true;
    slot.activating=true;
    touchActive(slot);
    showStatus(slot,`LOADING ${slot.label}`,getSketchfabUid(slot.entry)?'Original geometry · materials · textures':'Preparing 3D asset…');
    try{
      let viewer;
      if(getSketchfabUid(slot.entry))viewer=createSketchfab(slot.entry,slot);
      else viewer=await createGlb(slot.entry,slot);
      if(!slot.active||!viewer)return;
      slot.viewer=viewer;
      slot.media.insertBefore(viewer,slot.loading);
      touchActive(slot);
    }catch(_){
      if(slot.active)showStatus(slot,`${slot.label} FAILED TO LOAD`,'Swipe away and back to retry',true);
    }finally{slot.activating=false}
  }

  const slotObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const slot=slots.get(e.target);
      if(!slot)return;
      if(e.isIntersecting&&e.intersectionRatio>.08)activateSlot(slot);
      else if(slot.active)setTimeout(()=>{
        if(!slot.media.matches(':hover')&&!isElementVisible(slot.media))deactivateSlot(slot);
      },250);
    });
  },{threshold:[0,.08,.25,.6],rootMargin:'80px 90px'});

  function isElementVisible(el){
    const r=el.getBoundingClientRect();
    return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;
  }

  function register3D(media,entry,label){
    const status=makeStatus(label);
    const slot={media,entry,label,...status,viewer:null,active:false,activating:false};
    media.appendChild(status.loading);
    slots.set(media,slot);
    slotObserver.observe(media);
  }

  function updateSlider(name){
    const state=sliderState.get(name);if(!state)return;
    const max=Math.max(0,state.root.scrollWidth-state.root.clientWidth);
    state.prev.disabled=state.root.scrollLeft<=3;
    state.next.disabled=max<=3||state.root.scrollLeft>=max-3;
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
        root.scrollBy({left:((first?.getBoundingClientRect().width||root.clientWidth*.82)+gap)*direction,behavior:reduceMotion?'auto':'smooth'});
      };
      prev.addEventListener('click',()=>step(-1));
      next.addEventListener('click',()=>step(1));
      let raf=0;
      root.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>updateSlider(name))},{passive:true});
      new MutationObserver(()=>requestAnimationFrame(()=>updateSlider(name))).observe(root.querySelector('.showcase-track'),{childList:true});
      updateSlider(name);
    });
    addEventListener('resize',()=>sliderState.forEach((_,name)=>updateSlider(name)),{passive:true});
  }

  function createModelCard(entry,index){
    const card=document.createElement('article');card.className='model-card';
    const media=document.createElement('div');media.className='model-card-view';
    if(getSketchfabUid(entry))media.classList.add('is-source-viewer');
    register3D(media,entry,'PROPERTY');
    const copy=document.createElement('div');copy.className='model-card-copy';
    const wrap=document.createElement('div'),small=document.createElement('small'),h3=document.createElement('h3');
    small.textContent=`PROPERTY ${String(index+1).padStart(2,'0')}`;h3.textContent=entry.title||`Property ${index+1}`;
    wrap.append(small,h3);copy.appendChild(wrap);
    if(entry.subtitle||entry.description){const p=document.createElement('p');p.textContent=entry.subtitle||entry.description;copy.appendChild(p)}
    card.append(media,copy);return card;
  }

  function renderModels(models){
    if(!modelTrack)return;modelTrack.replaceChildren();
    if(!models.length){empty(modelTrack,'PROPERTY ARCHIVE');updateSlider('models');return}
    models.forEach((e,i)=>modelTrack.appendChild(createModelCard(e,i)));updateSlider('models');
  }

  function renderImages(images){
    if(!frameTrack)return;frameTrack.replaceChildren();
    if(!images.length){empty(frameTrack,'PROJECT MEDIA ARCHIVE');updateSlider('frames');return}
    images.forEach((entry,index)=>{
      const figure=document.createElement('figure');figure.className='frame-card';
      const img=document.createElement('img');img.src=entry.asset_url;img.alt=entry.description||entry.title||'DIRECTIVE I project frame';img.loading='lazy';
      const caption=document.createElement('figcaption'),title=document.createElement('span'),num=document.createElement('span');
      title.textContent=entry.title||'Project Frame';num.textContent=String(index+1).padStart(2,'0');caption.append(title,num);figure.append(img,caption);frameTrack.appendChild(figure);
    });updateSlider('frames');
  }

  function renderItems(items){
    if(!itemTrack)return;itemTrack.replaceChildren();
    if(!items.length){empty(itemTrack,'ITEM ARCHIVE READY');updateSlider('items');return}
    items.forEach((entry,index)=>{
      const card=document.createElement('article');card.className='item-card';
      const media=document.createElement('div');media.className='item-media';
      if(hasInteractiveModel(entry)){
        media.classList.add('item-media-3d');if(getSketchfabUid(entry))media.classList.add('is-source-viewer');register3D(media,entry,'PROJECT ITEM');
      }else{
        const img=document.createElement('img');img.src=entry.thumbnail_url||entry.asset_url;img.alt=entry.description||entry.title||'DIRECTIVE I project item';img.loading='lazy';media.appendChild(img);
      }
      const copy=document.createElement('div');copy.className='item-copy';
      const small=document.createElement('small'),h3=document.createElement('h3');small.textContent=entry.subtitle||`PROJECT ITEM ${String(index+1).padStart(2,'0')}`;h3.textContent=entry.title||'Unnamed item';copy.append(small,h3);
      if(entry.description){const p=document.createElement('p');p.textContent=entry.description;copy.appendChild(p)}
      card.append(media,copy);itemTrack.appendChild(card);
    });updateSlider('items');
  }

  async function load(){
    try{
      const res=await fetch(`${ENDPOINT}?t=${Date.now()}`,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await res.json();if(!res.ok||!data?.ok)throw new Error('SHOWCASE_UNAVAILABLE');
      const entries=Array.isArray(data.entries)?data.entries:[];
      renderModels(entries.filter(x=>x.kind==='model'));
      renderImages(entries.filter(x=>x.kind==='image'));
      renderItems(entries.filter(x=>x.kind==='item'));
    }catch(error){
      console.warn('DIRECTIVE I Showcase unavailable',error);renderModels([]);renderItems([]);
      if(frameTrack){frameTrack.innerHTML='<figure class="frame-card"><img src="assets/directive-i-hero-poster.jpg" alt="DIRECTIVE I project frame"><figcaption><span>World / Atmosphere</span><span>01</span></figcaption></figure>';updateSlider('frames')}
    }
  }

  const revealNodes=[...document.querySelectorAll('.reveal')];
  if(reduceMotion||!('IntersectionObserver'in window))revealNodes.forEach(n=>n.classList.add('is-visible'));
  else{
    const revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');revealObserver.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -5% 0px'});
    revealNodes.forEach(n=>revealObserver.observe(n));
  }

  addEventListener('pagehide',()=>{
    [...activeSlots].forEach(deactivateSlot);
    modelObjectUrls.forEach(url=>URL.revokeObjectURL(url));modelObjectUrls.clear();
  },{once:true});

  setupSliders();load();
})();