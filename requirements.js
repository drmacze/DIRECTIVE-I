(() => {
  const button=document.querySelector('[data-check-device]');
  const verdict=document.querySelector('[data-scan-verdict]');
  const note=document.querySelector('[data-scan-note]');
  const field=name=>document.querySelector(`[data-${name}]`);
  const status=name=>document.querySelector(`[data-${name}-status]`);

  function setStatus(name,text,state='manual'){
    const el=status(name); if(!el)return;
    el.textContent=text;
    el.className=state;
  }

  function platformInfo(){
    const ua=navigator.userAgent||'';
    const p=navigator.userAgentData?.platform||navigator.platform||'';
    const ios=/iPhone|iPad|iPod/i.test(ua)||((p==='MacIntel')&&navigator.maxTouchPoints>1);
    const android=/Android/i.test(ua);
    const windows=/Windows/i.test(ua)||/Win/i.test(p);
    if(ios)return {name:'iOS / iPadOS',type:'ios'};
    if(android)return {name:'Android',type:'android'};
    if(windows)return {name:'Windows PC',type:'windows'};
    if(/Mac/i.test(p)||/Mac OS/i.test(ua))return {name:'macOS',type:'mac'};
    if(/Linux/i.test(p)||/Linux/i.test(ua))return {name:'Linux',type:'linux'};
    return {name:p||'Unknown platform',type:'unknown'};
  }

  function webglInfo(){
    let gl=null;
    try{gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance'})}catch(_){ }
    const webgl2=!!gl;
    if(!gl){try{gl=document.createElement('canvas').getContext('webgl',{powerPreference:'high-performance'})}catch(_){ }}
    let renderer='Hidden by browser';
    if(gl){
      try{
        const ext=gl.getExtension('WEBGL_debug_renderer_info');
        renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):(gl.getParameter(gl.RENDERER)||renderer);
      }catch(_){ }
    }
    return {webgl2,renderer:String(renderer||'Hidden by browser')};
  }

  async function webgpuInfo(){
    if(!navigator.gpu?.requestAdapter)return null;
    try{
      const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      if(!adapter)return null;
      const info=adapter.info||{};
      return [info.vendor,info.architecture,info.device,info.description].filter(Boolean).join(' · ')||'WebGPU adapter available';
    }catch(_){return null}
  }

  function evaluateGpu(platform,renderer,webgpu){
    const text=`${renderer} ${webgpu||''}`.toLowerCase();
    const adreno=text.match(/adreno[^0-9]*([0-9]{3,4})/i);
    if(adreno){
      const n=Number(adreno[1]);
      return n>=640?{result:'pass',label:`Adreno ${n} — supported baseline`}:{result:'fail',label:`Adreno ${n} — below Adreno 640`};
    }
    const mali=text.match(/mali[- _]?(?:g)?([0-9]{2,3})/i);
    if(mali){
      const n=Number(mali[1]);
      return n>=77?{result:'pass',label:`Mali-G${n} class — supported baseline`}:{result:'fail',label:`Mali-G${n} — below target class`};
    }
    if(platform.type==='ios'){
      const chip=text.match(/apple\s*a([0-9]{2})/i);
      if(chip){
        const n=Number(chip[1]);
        return n>=12?{result:'pass',label:`Apple A${n} — supported baseline`}:{result:'fail',label:`Apple A${n} — A12 or newer required`};
      }
      return {result:'manual',label:'Apple GPU detected; exact A-series chip is hidden'};
    }
    if(platform.type==='windows'){
      return {result:'manual',label:'GPU detected; DirectX feature level is not exposed to web pages'};
    }
    if(text.includes('mali')||text.includes('adreno'))return {result:'manual',label:'Mobile GPU detected; model could not be verified'};
    return {result:'manual',label:'GPU model is hidden or not mapped'};
  }

  async function scan(){
    if(!button)return;
    button.disabled=true;
    button.querySelector('span').textContent='SCANNING…';
    verdict.dataset.state='idle';
    verdict.querySelector('strong').textContent='SCANNING HARDWARE';

    const platform=platformInfo();
    const gl=webglInfo();
    const gpuExtra=await webgpuInfo();
    const gpuName=(gl.renderer==='Hidden by browser'&&gpuExtra)?gpuExtra:gl.renderer;
    const memory=Number(navigator.deviceMemory||0);
    const gpu=evaluateGpu(platform,gpuName,gpuExtra);

    field('platform').textContent=platform.name;
    setStatus('platform','Detected','pass');
    field('gpu').textContent=gpuName;
    setStatus('gpu',gpu.label,gpu.result);
    field('api').textContent=gl.webgl2?(navigator.gpu?'WebGL 2 + WebGPU':'WebGL 2'):(navigator.gpu?'WebGPU / WebGL 1':'WebGL 1');
    setStatus('api',gl.webgl2?'Modern browser graphics path available':'WebGL 2 not detected',gl.webgl2?'pass':'manual');

    if(memory){
      field('memory').textContent=`${memory} GB exposed`;
      setStatus('memory',memory>=4?'Meets 4 GB minimum':'Below 4 GB minimum',memory>=4?'pass':'fail');
    }else{
      field('memory').textContent='Hidden by browser';
      setStatus('memory','Confirm 4 GB RAM manually','manual');
    }

    field('storage').textContent='10 GB free required';
    setStatus('storage','Browser cannot read device free space','manual');

    const hardFail=gpu.result==='fail'||(memory>0&&memory<4);
    const confirmedGpu=gpu.result==='pass';
    let state='manual',title='NEEDS MANUAL CHECK';
    let copy='Your browser hides one or more hardware details. Confirm the highlighted requirements before installing.';

    if(hardFail){
      state='fail'; title='NOT SUPPORTED';
      copy='At least one detected hardware requirement is below the DIRECTIVE I compatibility baseline.';
    }else if(confirmedGpu&&gl.webgl2&&(memory===0||memory>=4)){
      state='supported'; title='LIKELY SUPPORTED';
      copy='The detectable graphics requirements meet the baseline. Confirm 10 GB of free device storage before installing.';
    }else if(platform.type==='windows'&&gl.webgl2){
      state='manual'; title='LIKELY COMPATIBLE';
      copy='Modern browser graphics support is available. Confirm that the Windows GPU supports DirectX 12 Feature Level 11 and that at least 10 GB storage is free.';
    }else if(platform.type==='ios'){
      state='manual'; title='CHECK A12 OR NEWER';
      copy='iOS browsers normally hide the exact A-series chip. If this device uses A12 Bionic or newer, has at least 4 GB RAM for this project baseline, and 10 GB free storage, it meets the stated mobile requirements.';
    }

    verdict.dataset.state=state;
    verdict.querySelector('strong').textContent=title;
    note.innerHTML=copy;
    window.DIRECTIVE_ANALYTICS?.track?.('requirements_device_check',{platform:platform.name,gpu:gpuName,gpu_result:gpu.result,webgl2:gl.webgl2,memory:memory||null,verdict:state});

    button.disabled=false;
    button.querySelector('span').textContent='CHECK AGAIN';
  }

  button?.addEventListener('click',scan);
})();