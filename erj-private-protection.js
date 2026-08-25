/* Everything Remote Job · private participant protection layer.
   This is a deterrence + attribution layer for the current static architecture.
   It does NOT pretend public/browser-delivered files can be cryptographically hidden. */
(function(){
  'use strict';
  function safeParse(v){ try{return JSON.parse(v||'null');}catch(e){return null;} }
  function session(){ return safeParse(localStorage.getItem('rjm_session')) || {}; }
  function hashId(s){
    s=String(s||'ERJ'); var h=2166136261;
    for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
    return ('00000000'+(h>>>0).toString(16).toUpperCase()).slice(-8);
  }
  function shortName(n){
    n=String(n||'Participant').trim(); if(!n) return 'Participant';
    var p=n.split(/\s+/); return p.length>1 ? p[0]+' '+p[p.length-1].charAt(0)+'.' : p[0];
  }
  function details(){
    var s=session(), email=String(s.email||''), cohort=String(s.cohort||'ERJ');
    return { name: shortName(s.name), id:'ERJ-'+hashId(email+'|'+cohort).slice(0,6), cohort:cohort.replace(/Cohort\s*/i,'Cohort ') };
  }
  function addMeta(){
    var metas={
      robots:'noindex,nofollow,noarchive,nosnippet,noimageindex',
      copyright:'Copyright 2026 Business Play Limited, trading as Everything Remote Job. All rights reserved.',
      rights:'Private participant material. Personal, non-transferable access. Redistribution prohibited.'
    };
    Object.keys(metas).forEach(function(k){
      var m=document.head.querySelector('meta[name="'+k+'"]');
      if(!m){m=document.createElement('meta');m.name=k;document.head.appendChild(m);} m.content=metas[k];
    });
  }
  function addWatermark(){
    if(document.getElementById('erjPrivateWatermark')) return;
    var d=details(), wrap=document.createElement('div');
    wrap.id='erjPrivateWatermark'; wrap.setAttribute('aria-hidden','true');
    var txt='LICENSED TO '+d.name.toUpperCase()+' · '+d.id+' · '+d.cohort.toUpperCase();
    wrap.innerHTML=Array(7).fill('<span>'+txt+'</span>').join('');
    wrap.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;display:flex;flex-direction:column;justify-content:space-around;align-items:center;opacity:.055;';
    Array.prototype.forEach.call(wrap.children,function(el){ el.style.cssText='display:block;width:140vw;text-align:center;transform:rotate(-23deg);font:700 18px/1.2 Inter,Arial,sans-serif;letter-spacing:.16em;color:currentColor;white-space:nowrap;'; });
    document.body.appendChild(wrap);
  }
  function addLicenseBanner(){
    if(document.getElementById('erjLicenseBanner')) return;
    var d=details(), box=document.createElement('div');
    box.id='erjLicenseBanner'; box.setAttribute('role','note');
    box.innerHTML='<strong>Personal participant licence</strong><span>Licensed to '+d.name+' · '+d.id+'. Course materials and resource links are for your individual use and may not be shared, resold, uploaded or redistributed.</span>';
    box.style.cssText='position:relative;z-index:3;margin:0 0 1rem;padding:.8rem .95rem;border:1px solid rgba(255,87,34,.28);border-left:3px solid #FF5722;border-radius:8px;background:rgba(255,87,34,.055);font:400 .76rem/1.55 Inter,Arial,sans-serif;';
    var st=box.querySelector('strong'); st.style.cssText='display:block;margin-bottom:.2rem;font-weight:800;color:#FF5722;';
    var target=document.querySelector('#viewMaterials') || document.querySelector('main') || document.body;
    if(target.firstChild) target.insertBefore(box,target.firstChild); else target.appendChild(box);
  }
  function protectedLinkNotice(){
    document.addEventListener('click',function(e){
      var a=e.target.closest && e.target.closest('a[href]'); if(!a) return;
      var href=a.getAttribute('href')||'';
      if(!/(docs\.google\.com|drive\.google\.com|t\.me\/)/i.test(href)) return;
      if(sessionStorage.getItem('erj_private_resource_ack')==='1') return;
      var d=details();
      var ok=window.confirm('ERJ participant resource\n\nLicensed to '+d.name+' ('+d.id+').\n\nThis link and its contents are for your personal participant use only. Do not forward, upload, resell or redistribute them.\n\nContinue to the resource?');
      if(!ok){e.preventDefault();e.stopPropagation();return;}
      sessionStorage.setItem('erj_private_resource_ack','1');
    },true);
  }
  addMeta();
  window.addEventListener('DOMContentLoaded',function(){ addWatermark(); addLicenseBanner(); protectedLinkNotice(); });
})();
