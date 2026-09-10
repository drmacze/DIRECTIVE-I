(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-console';
  const SUPABASE_URL='https://ydaeukhqwishlrjyfktk.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9';
  const BUCKET='directive-showcase';
  const TOKEN_KEY='directive_ops_session';
  const auth=document.querySelector('[data-auth]');
  const app=document.querySelector('[data-app]');
  const loginForm=document.querySelector('[data-login-form]');
  const pinInput=document.querySelector('[data-pin]');
  const loginError=document.querySelector('[data-login-error]');
  const supabaseClient=window.supabase?.createClient?.(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:false}});
  let token='';
  let dashboardCache=null;
  let showcase=[];
  let currentEntry=null;
  let uploadedPath='';

  try{token=sessionStorage.getItem(TOKEN_KEY)||''}catch(_){ }

  async function request(action,payload={},requiresAuth=true){
    const headers={'Content-Type':'application/json'};
    if(requiresAuth&&token)headers['x-directive-console-token']=token;
    const res=await fetch(ENDPOINT,{method:'POST',headers,body:JSON.stringify({action,...payload})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data?.ok){
      if(res.status===401&&requiresAuth)lock();
      throw new Error(data?.error||`HTTP_${res.status}`);
    }
    return data;
  }

  function unlock(){auth.hidden=true;app.hidden=false;}
  function lock(){token='';try{sessionStorage.removeItem(TOKEN_KEY)}catch(_){ }app.hidden=true;auth.hidden=false;pinInput?.focus();}
  async function logout(){try{if(token)await request('logout')}catch(_){ }lock();}

  const fmt=n=>new Intl.NumberFormat('en-US').format(Number(n||0));
  const niceDate=value=>{try{return new Date(value).toLocaleString()}catch(_){return String(value||'')}};
  const empty=(root,text='No data yet.')=>{root.replaceChildren();const el=document.createElement('div');el.className='empty-state';el.textContent=text;root.appendChild(el)};
  function metricList(root,rows,labelKey='label',valueKey='value'){
    root.replaceChildren();
    if(!rows?.length)return empty(root);
    rows.forEach(row=>{const el=document.createElement('div');el.className='metric-row';const label=document.createElement('span');label.textContent=String(row[labelKey]||'—');const value=document.createElement('strong');value.textContent=fmt(row[valueKey]);el.append(label,value);root.appendChild(el)});
  }

  async function loadDashboard(){
    const button=document.querySelector('[data-refresh-dashboard]');if(button)button.disabled=true;
    try{
      const data=await request('dashboard');dashboardCache=data.dashboard;renderDashboard(data.dashboard);
    }catch(error){console.error(error)}finally{if(button)button.disabled=false}
  }
  function renderDashboard(d){
    const t=d?.totals||{};
    const cards=[['Page views',t.pageViews],['Views today',t.viewsToday],['Unique sessions',t.uniqueSessions],['Active / 15 min',t.active15m],['Views / 7 days',t.views7d],['Visitors / 7 days',t.unique7d],['Account logins',t.accountLogins],['Lifetime plays',t.lifetimeUserPlays]];
    const grid=document.querySelector('[data-stats-grid]');grid.replaceChildren();
    cards.forEach(([label,value])=>{const card=document.createElement('article');card.className='stat-card';const s=document.createElement('span');s.textContent=label;const strong=document.createElement('strong');strong.textContent=fmt(value);card.append(s,strong);grid.appendChild(card)});
    metricList(document.querySelector('[data-top-pages]'),d?.topPages||[],'path','views');
    metricList(document.querySelector('[data-devices]'),d?.devices||[]);
    metricList(document.querySelector('[data-browsers]'),d?.browsers||[]);
    metricList(document.querySelector('[data-os]'),d?.os||[]);
    metricList(document.querySelector('[data-referrers]'),d?.referrers||[]);
    metricList(document.querySelector('[data-event-types]'),d?.eventTypes||[]);
    renderTraffic(d?.daily||[]);
    renderAudit(d?.audit||[]);
  }
  function renderTraffic(rows){
    const root=document.querySelector('[data-traffic-chart]');root.replaceChildren();
    if(!rows.length)return empty(root);
    const max=Math.max(1,...rows.map(r=>Math.max(Number(r.views||0),Number(r.visitors||0))));
    rows.forEach(row=>{const col=document.createElement('div');col.className='traffic-col';col.title=`${row.day}: ${fmt(row.views)} views / ${fmt(row.visitors)} visitors`;const views=document.createElement('i');views.style.height=`${Math.max(2,Number(row.views||0)/max*100)}%`;const visitors=document.createElement('b');visitors.style.height=`${Math.max(2,Number(row.visitors||0)/max*100)}%`;const day=document.createElement('small');day.textContent=String(row.day||'').slice(5);col.append(views,visitors,day);root.appendChild(col)});
  }
  function renderAudit(rows){
    const root=document.querySelector('[data-audit-list]');root.replaceChildren();
    if(!rows?.length)return empty(root,'No console activity yet.');
    rows.forEach(row=>{const el=document.createElement('div');el.className='audit-item';const a=document.createElement('div');const strong=document.createElement('strong');strong.textContent=String(row.action||'activity').replaceAll('_',' ');const detail=document.createElement('span');detail.textContent=[row.target_type,row.target_id].filter(Boolean).join(' · ');a.append(strong,detail);const time=document.createElement('span');time.textContent=niceDate(row.created_at);el.append(a,time);root.appendChild(el)});
  }

  async function loadShowcase(){
    const data=await request('list_showcase');showcase=data.entries||[];renderShowcaseList();
  }
  function renderShowcaseList(){
    const root=document.querySelector('[data-showcase-list]');root.replaceChildren();document.querySelector('[data-showcase-count]').textContent=`${showcase.length} entries`;
    if(!showcase.length)return empty(root,'No Showcase content yet.');
    showcase.forEach(entry=>{const button=document.createElement('button');button.type='button';button.className='admin-entry';button.addEventListener('click',()=>editEntry(entry));const img=document.createElement('img');img.alt='';img.src=entry.thumbnail_url||entry.asset_url||'';img.onerror=()=>{img.style.visibility='hidden'};const copy=document.createElement('div');const small=document.createElement('small');small.textContent=entry.kind;const strong=document.createElement('strong');strong.textContent=entry.title;copy.append(small,strong);const status=document.createElement('em');status.textContent=entry.is_published?'LIVE':'DRAFT';button.append(img,copy,status);root.appendChild(button)});
  }
  function resetEditor(){
    currentEntry=null;uploadedPath='';document.querySelector('[data-editor-title]').textContent='New showcase entry';document.querySelector('[data-delete-entry]').hidden=true;document.querySelector('[data-entry-id]').value='';document.querySelector('[data-entry-kind]').value='image';document.querySelector('[data-entry-sort]').value='100';document.querySelector('[data-entry-title]').value='';document.querySelector('[data-entry-subtitle]').value='';document.querySelector('[data-entry-description]').value='';document.querySelector('[data-entry-url]').value='';document.querySelector('[data-entry-thumb]').value='';document.querySelector('[data-entry-published]').checked=true;document.querySelector('[data-editor-error]').textContent='';document.querySelector('[data-upload-status]').textContent='';
  }
  function editEntry(entry){
    currentEntry=entry;uploadedPath=entry?.metadata?.storage_path||'';document.querySelector('[data-editor-title]').textContent='Edit showcase entry';document.querySelector('[data-delete-entry]').hidden=false;document.querySelector('[data-entry-id]').value=entry.id||'';document.querySelector('[data-entry-kind]').value=entry.kind||'image';document.querySelector('[data-entry-sort]').value=entry.sort_order??100;document.querySelector('[data-entry-title]').value=entry.title||'';document.querySelector('[data-entry-subtitle]').value=entry.subtitle||'';document.querySelector('[data-entry-description]').value=entry.description||'';document.querySelector('[data-entry-url]').value=entry.asset_url||'';document.querySelector('[data-entry-thumb]').value=entry.thumbnail_url||'';document.querySelector('[data-entry-published]').checked=entry.is_published!==false;document.querySelector('[data-editor-error]').textContent='';
  }
  function collectEntry(){
    return {kind:document.querySelector('[data-entry-kind]').value,sort_order:Number(document.querySelector('[data-entry-sort]').value||100),title:document.querySelector('[data-entry-title]').value,subtitle:document.querySelector('[data-entry-subtitle]').value,description:document.querySelector('[data-entry-description]').value,asset_url:document.querySelector('[data-entry-url]').value,thumbnail_url:document.querySelector('[data-entry-thumb]').value,is_published:document.querySelector('[data-entry-published]').checked,metadata:{...(currentEntry?.metadata||{}),...(uploadedPath?{storage_path:uploadedPath}:{})}};
  }
  async function persistEntry(){
    const id=document.querySelector('[data-entry-id]').value||null;
    const data=await request('save_showcase',{id,entry:collectEntry()});
    if(data?.entry){
      currentEntry=data.entry;
      document.querySelector('[data-entry-id]').value=data.entry.id||'';
      document.querySelector('[data-editor-title]').textContent='Edit showcase entry';
      document.querySelector('[data-delete-entry]').hidden=false;
    }
    await loadShowcase();await loadDashboard();
    return data?.entry||null;
  }
  async function saveEntry(event){
    event.preventDefault();const errorEl=document.querySelector('[data-editor-error]');errorEl.textContent='';
    try{await persistEntry();resetEditor()}catch(error){errorEl.textContent=error.message}
  }
  async function deleteEntry(){
    const id=document.querySelector('[data-entry-id]').value;if(!id||!confirm('Delete this Showcase entry?'))return;
    try{await request('delete_showcase',{id});resetEditor();await loadShowcase();await loadDashboard()}catch(error){document.querySelector('[data-editor-error]').textContent=error.message}
  }
  function friendlyTitle(filename){
    return filename.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase()).slice(0,120)||'Showcase Asset';
  }
  async function uploadAsset(){
    const input=document.querySelector('[data-upload-file]');const status=document.querySelector('[data-upload-status]');const file=input.files?.[0];if(!file)return status.textContent='Choose a file first.';if(file.size>50*1024*1024)return status.textContent='Maximum file size is 50 MB.';if(!supabaseClient)return status.textContent='Storage client unavailable.';
    status.textContent='Preparing upload…';
    try{
      let contentType=file.type||'';if(!contentType&&/\.glb$/i.test(file.name))contentType='model/gltf-binary';if(!contentType&&/\.gltf$/i.test(file.name))contentType='model/gltf+json';if(!contentType)contentType='application/octet-stream';
      const isModel=/\.glb$|\.gltf$/i.test(file.name)||/^model\//.test(contentType);
      const isImage=/^image\//.test(contentType);
      if(isModel)document.querySelector('[data-entry-kind]').value='model';
      else if(isImage)document.querySelector('[data-entry-kind]').value='image';
      const titleInput=document.querySelector('[data-entry-title]');if(!titleInput.value.trim())titleInput.value=friendlyTitle(file.name);
      const signed=await request('create_upload',{filename:file.name,content_type:contentType});status.textContent='Uploading…';
      const {error}=await supabaseClient.storage.from(BUCKET).uploadToSignedUrl(signed.path,signed.token,file,{contentType});if(error)throw error;
      uploadedPath=signed.path;document.querySelector('[data-entry-url]').value=signed.public_url;if(isImage)document.querySelector('[data-entry-thumb]').value=signed.public_url;
      status.textContent='Upload complete. Saving Showcase entry…';
      const saved=await persistEntry();
      status.textContent=saved?.is_published===false?'Uploaded and saved as draft.':'Uploaded and published.';
      input.value='';
    }catch(error){status.textContent=error.message||'Upload failed.'}
  }

  function showView(name){
    document.querySelectorAll('[data-view]').forEach(v=>v.hidden=v.dataset.view!==name);document.querySelectorAll('[data-view-button]').forEach(b=>b.classList.toggle('is-active',b.dataset.viewButton===name));const mobile=document.querySelector('[data-mobile-view]');if(mobile)mobile.value=name;if(name==='dashboard')loadDashboard();if(name==='showcase')loadShowcase();if(name==='security'&&dashboardCache)renderAudit(dashboardCache.audit||[]);
  }

  loginForm.addEventListener('submit',async event=>{
    event.preventDefault();loginError.textContent='';const submit=loginForm.querySelector('button');submit.disabled=true;
    try{const data=await request('login',{pin:pinInput.value},false);token=data.token;try{sessionStorage.setItem(TOKEN_KEY,token)}catch(_){ }pinInput.value='';unlock();showView('dashboard')}catch(error){loginError.textContent=error.message==='INVALID_PIN'?'Invalid console PIN.':error.message==='TOO_MANY_ATTEMPTS'?'Too many attempts. Try again later.':error.message}finally{submit.disabled=false}
  });
  document.querySelectorAll('[data-view-button]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.viewButton)));
  document.querySelector('[data-mobile-view]').addEventListener('change',event=>showView(event.target.value));
  document.querySelector('[data-refresh-dashboard]').addEventListener('click',loadDashboard);
  document.querySelector('[data-new-showcase]').addEventListener('click',resetEditor);
  document.querySelector('[data-showcase-form]').addEventListener('submit',saveEntry);
  document.querySelector('[data-delete-entry]').addEventListener('click',deleteEntry);
  document.querySelector('[data-upload]').addEventListener('click',uploadAsset);
  document.querySelectorAll('[data-logout],[data-logout-mobile],[data-security-logout]').forEach(button=>button.addEventListener('click',logout));

  (async()=>{
    if(!token)return lock();
    try{await request('verify');unlock();showView('dashboard')}catch(_){lock()}
  })();
})();