(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-showcase';
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const stage=document.querySelector('[data-model-stage]');
  const modelTabs=document.querySelector('[data-model-tabs]');
  const frameGrid=document.querySelector('[data-frame-grid]');
  const itemGrid=document.querySelector('[data-item-grid]');
  let modelViewerLoaded=false;

  const empty=(root,text)=>{if(!root)return;root.replaceChildren();const el=document.createElement('div');el.className='items-empty';const wrap=document.createElement('div');const strong=document.createElement('strong');strong.textContent=text;const span=document.createElement('span');span.textContent='Content will appear here when published from the developer console.';wrap.append(strong,span);el.appendChild(wrap);root.appendChild(el)};

  function loadModelViewer(){
    if(modelViewerLoaded||customElements.get('model-viewer')){modelViewerLoaded=true;return Promise.resolve()}
    return new Promise(resolve=>{const s=document.createElement('script');s.type='module';s.src='https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';s.onload=()=>{modelViewerLoaded=true;resolve()};s.onerror=resolve;document.head.appendChild(s)});
  }

  async function showModel(entry){
    if(!stage)return;
    await loadModelViewer();
    stage.replaceChildren();
    if(!customElements.get('model-viewer'))return empty(stage,'3D viewer unavailable');
    const viewer=document.createElement('model-viewer');
    viewer.src=entry.asset_url;viewer.alt=entry.title||'DIRECTIVE I 3D model';viewer.setAttribute('camera-controls','');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('shadow-intensity','1');viewer.setAttribute('environment-image','neutral');viewer.setAttribute('interaction-prompt','auto');if(!reduceMotion)viewer.setAttribute('auto-rotate','');
    stage.appendChild(viewer);
    modelTabs?.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b.dataset.id===entry.id));
    window.DIRECTIVE_ANALYTICS?.track?.('showcase_model_view',{id:entry.id,title:entry.title});
  }

  function renderModels(models){
    modelTabs?.replaceChildren();
    if(!models.length){empty(stage,'3D MODEL ARCHIVE');return}
    models.forEach((entry,index)=>{const b=document.createElement('button');b.type='button';b.dataset.id=entry.id;b.textContent=entry.title||`Model ${index+1}`;b.addEventListener('click',()=>showModel(entry));modelTabs?.appendChild(b)});
    showModel(models[0]);
  }

  function renderImages(images){
    frameGrid?.replaceChildren();
    if(!images.length){empty(frameGrid,'PROJECT MEDIA ARCHIVE');return}
    images.forEach((entry,index)=>{const figure=document.createElement('figure');figure.className='frame-card';const img=document.createElement('img');img.src=entry.asset_url;img.alt=entry.description||entry.title||'DIRECTIVE I project frame';img.loading='lazy';const caption=document.createElement('figcaption');const title=document.createElement('span');title.textContent=entry.title||'Project Frame';const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');caption.append(title,number);figure.append(img,caption);frameGrid?.appendChild(figure)});
  }

  function renderItems(items){
    itemGrid?.replaceChildren();
    if(!items.length){empty(itemGrid,'ITEM ARCHIVE READY');return}
    items.forEach(entry=>{const card=document.createElement('article');card.className='item-card';const media=document.createElement('div');media.className='item-media';const img=document.createElement('img');img.src=entry.thumbnail_url||entry.asset_url;img.alt=entry.description||entry.title||'DIRECTIVE I project item';img.loading='lazy';media.appendChild(img);const copy=document.createElement('div');copy.className='item-copy';const small=document.createElement('small');small.textContent=entry.subtitle||'PROJECT ITEM';const h3=document.createElement('h3');h3.textContent=entry.title||'Unnamed item';copy.append(small,h3);if(entry.description){const p=document.createElement('p');p.textContent=entry.description;copy.appendChild(p)}card.append(media,copy);itemGrid?.appendChild(card)});
  }

  async function load(){
    try{
      const res=await fetch(ENDPOINT,{headers:{Accept:'application/json'}});const data=await res.json();if(!res.ok||!data?.ok)throw new Error('showcase unavailable');
      const entries=Array.isArray(data.entries)?data.entries:[];renderModels(entries.filter(x=>x.kind==='model'));renderImages(entries.filter(x=>x.kind==='image'));renderItems(entries.filter(x=>x.kind==='item'));
    }catch(_){
      renderModels([]);
      if(frameGrid){frameGrid.innerHTML='<figure class="frame-card"><img src="assets/directive-i-hero-poster.jpg" alt="DIRECTIVE I cinematic project frame"><figcaption><span>World / Atmosphere</span><span>01</span></figcaption></figure><figure class="frame-card"><img src="assets/directive-i-trailer-poster.jpg" alt="DIRECTIVE I trailer project frame"><figcaption><span>Transmission / Scene</span><span>02</span></figcaption></figure>'}
      renderItems([]);
    }
  }

  const revealNodes=Array.from(document.querySelectorAll('.reveal'));
  if(reduceMotion||!('IntersectionObserver'in window))revealNodes.forEach(node=>node.classList.add('is-visible'));else{const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');observer.unobserve(entry.target)})},{threshold:.12,rootMargin:'0px 0px -7% 0px'});revealNodes.forEach(node=>observer.observe(node))}
  load();
})();