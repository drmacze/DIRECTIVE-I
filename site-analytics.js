(() => {
  const ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/directive-analytics';
  const KEY='directive_analytics_session';
  const now=Date.now();
  let session=null;
  try{session=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){ }
  if(!session||!session.id||now-(session.updatedAt||0)>30*60*1000){session={id:(crypto.randomUUID?.()||`${now}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g,''),updatedAt:now}else session.updatedAt=now;
  try{localStorage.setItem(KEY,JSON.stringify(session))}catch(_){ }
  const ua=navigator.userAgent||'';
  const device=/iPad|Tablet/i.test(ua)?'tablet':/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';
  const browser=/Edg\//.test(ua)?'Edge':/CriOS|Chrome\//.test(ua)?'Chrome':/FxiOS|Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Other';
  const os=/iPhone|iPad|iPod/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Other';
  const referrer=(()=>{try{return document.referrer?new URL(document.referrer).hostname:''}catch(_){return ''}})();
  async function track(eventType='page_view',metadata={}){const payload={session_id:session.id,event_type:eventType,path:location.pathname.replace('/DIRECTIVE-I','')||'/',referrer,device,browser,os,screen_width:screen.width||null,metadata};try{await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true})}catch(_){ }}
  window.DIRECTIVE_ANALYTICS={track};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>track(),{once:true});else track();
  document.addEventListener('click',event=>{const target=event.target.closest?.('a,button');if(!target)return;if(target.matches('[data-open-trailer]'))track('trailer_open');const href=target.getAttribute?.('href')||'';if(/showcase\.html/.test(href))track('showcase_open');else if(/requirements\.html/.test(href))track('requirements_open');else if(/documentation\.html/.test(href))track('documentation_open');else if(/core-gameplay\.html/.test(href))track('core_gameplay_open');else if(/story\.html/.test(href))track('story_open')},{passive:true});
})();