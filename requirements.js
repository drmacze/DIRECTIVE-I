(() => {
  const button=document.querySelector('[data-check-device]');
  const layer=document.querySelector('[data-scan-layer]');
  const sheet=document.querySelector('[data-scan-sheet]');
  const verdict=document.querySelector('[data-scan-verdict]');
  const note=document.querySelector('[data-scan-note]');
  const field=name=>document.querySelector(`[data-${name}]`);
  const status=name=>document.querySelector(`[data-${name}-status]`);
  let openedAt=0;

  function setStatus(name,text,state='manual'){
    const el=status(name); if(!el)return;
    el.textContent=text;
    el.className=state;
  }

  async function platformInfo(){
    const ua=navigator.userAgent||'';
    const p=navigator.userAgentData?.platform||navigator.platform||'';
    let model='';
    if(navigator.userAgentData?.getHighEntropyValues){
      try{
        const hi=await navigator.userAgentData.getHighEntropyValues(['model','platformVersion','architecture','bitness']);
        model=hi?.model||'';
      }catch(_){ }
    }
    const ios=/iPhone|iPad|iPod/i.test(ua)||((p==='MacIntel')&&navigator.maxTouchPoints>1);
    const android=/Android/i.test(ua);
    const windows=/Windows/i.test(ua)||/Win/i.test(p);
    if(ios)return {name:'iOS / iPadOS',type:'ios',model};
    if(android)return {name:model?`Android · ${model}`:'Android',type:'android',model};
    if(windows)return {name:'Windows PC',type:'windows',model};
    if(/Mac/i.test(p)||/Mac OS/i.test(ua))return {name:'macOS',type:'mac',model};
    if(/Linux/i.test(p)||/Linux/i.test(ua))return {name:'Linux',type:'linux',model};
    return {name:p||'Unknown platform',type:'unknown',model};
  }

  function webglInfo(){
    let gl=null;
    let version=0;
    try{gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',failIfMajorPerformanceCaveat:false})}catch(_){ }
    if(gl)version=2;
    if(!gl){
      try{gl=document.createElement('canvas').getContext('webgl',{powerPreference:'high-performance',failIfMajorPerformanceCaveat:false})}catch(_){ }
      if(gl)version=1;
    }
    let renderer='Hidden by browser';
    let vendor='';
    if(gl){
      try{
        const ext=gl.getExtension('WEBGL_debug_renderer_info');
        renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):(gl.getParameter(gl.RENDERER)||renderer);
        vendor=ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):(gl.getParameter(gl.VENDOR)||'');
      }catch(_){ }
    }
    return {version,renderer:String(renderer||'Hidden by browser'),vendor:String(vendor||'')};
  }

  async function webgpuInfo(){
    if(!navigator.gpu?.requestAdapter)return null;
    try{
      const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      if(!adapter)return null;
      let info=adapter.info||{};
      if(typeof adapter.requestAdapterInfo==='function'){
        try{info=await adapter.requestAdapterInfo()}catch(_){ }
      }
      const label=[info.vendor,info.architecture,info.device,info.description].filter(Boolean).join(' · ');
      return label||'WebGPU adapter available';
    }catch(_){return null}
  }

  function evaluateGpu(platform,renderer,webgpu,vendor){
    const text=`${renderer} ${webgpu||''} ${vendor||''}`.toLowerCase();
    const adreno=text.match(/adreno(?:\s*\(tm\))?[^0-9]*([0-9]{3,4})/i);
    if(adreno){
      const n=Number(adreno[1]);
      return n>=640?{result:'pass',label:`Adreno ${n} meets baseline`}:{result:'fail',label:`Adreno ${n} is below 640 baseline`};
    }
    const mali=text.match(/mali[- _]?(?:g)?([0-9]{2,4})/i);
    if(mali){
      const n=Number(mali[1]);
      const pass=n>=77;
      return pass?{result:'pass',label:`Mali-G${n} class meets baseline`}:{result:'fail',label:`Mali-G${n} is below target class`};
    }
    if(platform.type==='ios'){
      const chip=text.match(/apple\s*a([0-9]{2})/i);
      if(chip){
        const n=Number(chip[1]);
        return n>=12?{result:'pass',label:`Apple A${n} meets baseline`}:{result:'fail',label:`Apple A${n} is below A12`};
      }
      if(text.includes('apple'))return {result:'manual',label:'Apple GPU detected · exact A-series hidden by Safari'};
      return {result:'manual',label:'Exact Apple GPU is hidden by browser'};
    }
    if(platform.type==='windows')return {result:'manual',label:'GPU detected · DirectX feature level is hidden from web pages'};
    if(text.includes('mali')||text.includes('adreno'))return {result:'manual',label:'Mobile GPU family detected · exact model unavailable'};
    return {result:'manual',label:'GPU model is hidden or cannot be mapped reliably'};
  }

  async function storageInfo(){
    if(!navigator.storage?.estimate)return null;
    try{
      const estimate=await navigator.storage.estimate();
      if(!Number.isFinite(estimate?.quota))return null;
      const gb=estimate.quota/1024/1024/1024;
      return gb>0?`${gb.toFixed(gb>=10?0:1)} GB browser quota`:null;
    }catch(_){return null}
  }

  function openSheet(){
    if(!layer)return;
    openedAt=Date.now();
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden','false');
    document.body.classList.add('scan-open');
    requestAnimationFrame(()=>sheet?.focus({preventScroll:true}));
  }

  function closeSheet(){
    if(!layer?.classList.contains('is-open'))return;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden','true');
    document.body.classList.remove('scan-open');
  }

  layer?.addEventListener('click',()=>{
    if(Date.now()-openedAt<320)return;
    closeSheet();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSheet()});

  async function scan(){
    if(!button||!verdict)return;
    button.disabled=true;
    const label=button.querySelector('span');
    if(label)label.textContent='SCANNING…';

    const [platform,gpuExtra,storage]=await Promise.all([platformInfo(),webgpuInfo(),storageInfo()]);
    const gl=webglInfo();
    const gpuName=(gl.renderer==='Hidden by browser'&&gpuExtra)?gpuExtra:gl.renderer;
    const memory=Number(navigator.deviceMemory||0);
    const gpu=evaluateGpu(platform,gpuName,gpuExtra,gl.vendor);

    field('platform').textContent=platform.name;
    setStatus('platform','Detected','pass');

    field('gpu').textContent=gpuName;
    setStatus('gpu',gpu.label,gpu.result);

    const api=[];
    if(gl.version)api.push(`WebGL ${gl.version}`);
    if(navigator.gpu)api.push('WebGPU');
    field('api').textContent=api.join(' + ')||'No modern web graphics API';
    setStatus('api',gl.version>=2?'Modern graphics path available':gl.version===1?'WebGL 1 only':'Graphics API unavailable',gl.version>=2?'pass':'manual');

    if(memory){
      field('memory').textContent=`${memory} GB reported`;
      setStatus('memory',memory>=4?'Meets 4 GB minimum':'Below 4 GB minimum',memory>=4?'pass':'fail');
    }else{
      field('memory').textContent='Hidden by browser';
      setStatus('memory','Confirm 4 GB RAM manually','manual');
    }

    field('storage').textContent='10 GB free required';
    setStatus('storage',storage?`${storage} · not equal to device free space`:'Device free space is private','manual');

    const hardFail=gpu.result==='fail'||(memory>0&&memory<4);
    const confirmedGpu=gpu.result==='pass';
    let state='manual',title='NEEDS MANUAL CHECK';
    let copy='Some hardware fields are intentionally hidden by this browser. Confirm the amber items manually before installing.';

    if(hardFail){
      state='fail';
      title='NOT SUPPORTED';
      copy='At least one hardware value exposed by the browser is below the DIRECTIVE I compatibility baseline.';
    }else if(confirmedGpu&&gl.version>=2&&(memory===0||memory>=4)){
      state='supported';
      title='LIKELY SUPPORTED';
      copy='The hardware values that can be detected meet the baseline. Confirm at least 10 GB of free device storage before installing.';
    }else if(platform.type==='windows'&&gl.version>=2){
      state='manual';
      title='LIKELY COMPATIBLE';
      copy='Modern browser graphics support is available. Confirm DirectX 12 Feature Level 11, at least 4 GB RAM, and 10 GB free storage.';
    }else if(platform.type==='ios'){
      state='manual';
      title='VERIFY A12 OR NEWER';
      copy='Safari does not expose the exact A-series chip, RAM, or device free space. If the device uses A12 Bionic or newer and meets the remaining requirements, it matches the stated baseline.';
    }

    verdict.dataset.state=state;
    verdict.querySelector('strong').textContent=title;
    note.textContent=copy;

    window.DIRECTIVE_ANALYTICS?.track?.('requirements_device_check',{
      platform:platform.name,
      gpu:gpuName,
      gpu_result:gpu.result,
      webgl:gl.version,
      memory:memory||null,
      storage_api:!!storage,
      verdict:state
    });

    if(label)label.textContent='CHECK AGAIN';
    button.disabled=false;
    openSheet();
  }

  button?.addEventListener('click',scan);
})();