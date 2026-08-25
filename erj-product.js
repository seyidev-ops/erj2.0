/* Shared product-page behaviour: scroll reveals, countdown timers, PWA register.
   Path-aware via window.ERJ_NAV.base. */
(function(){
  var base=(window.ERJ_NAV&&typeof window.ERJ_NAV.base==='string')?window.ERJ_NAV.base:'';
  /* reveals */
  var els=document.querySelectorAll('.reveal');
  var obs=null;
  function showNow(e){
    e.style.transitionDelay='0s';
    e.classList.add('in');
    if(obs)obs.unobserve(e);
  }
  if('IntersectionObserver' in window){
    obs=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){
        var sibs=[].slice.call(e.target.parentNode.querySelectorAll(':scope > .reveal'));
        var idx=sibs.indexOf(e.target);
        e.target.style.transitionDelay=(Math.max(0,idx)*0.05)+'s';
        e.target.classList.add('in'); obs.unobserve(e.target);
    /* THRESHOLD IS 0, NOT 0.14, AND THAT MATTERS. A threshold asks for a
       PROPORTION OF THE ELEMENT to be on screen, so for any section taller
       than about seven viewports it can never be satisfied \u2014 the most that
       can ever be visible is viewport/section, and the element then stays at
       opacity:0 permanently. On the night theme that reads as empty space; on
       the day theme it is a blank white gap. Sections cross that line the
       moment anything is injected into them (a scan result, a diagnostic
       report), so a percentage threshold is simply the wrong instrument here.
       One pixel plus the 120px margin is the right trigger. */
      }});},{threshold:0,rootMargin:'0px 0px 120px 0px'});
    els.forEach(function(e){obs.observe(e);});
  } else { els.forEach(function(e){e.classList.add('in');}); }
  /* Jumping straight into a section — the nav's "quick tour" links, any
     in-page anchor (#joints etc.), or a URL that already carries a #hash on
     load — moves the viewport in a single instant frame. The observer above
     only sees whatever is on-screen at that instant, so a card further down
     a tall section (e.g. the 3rd/4th "Four Problem · Fix It" card) is left
     sitting at opacity:0 until the reader scrolls again. On the night theme
     that just reads as empty space; on the day theme it is a plain blank
     white gap. Force-reveal the target section, and everything the reader
     has effectively skipped past above it, the moment a hash is present. */
  function revealThroughHash(){
    var hash=location.hash;
    if(!hash||hash.length<2)return;
    var target=document.getElementById(hash.slice(1));
    if(!target)return;
    if(target.classList&&target.classList.contains('reveal'))showNow(target);
    target.querySelectorAll&&target.querySelectorAll('.reveal').forEach(showNow);
    document.querySelectorAll('.reveal').forEach(function(e){
      if(e!==target&&(target.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING)){
        showNow(e);
      }
    });
  }
  revealThroughHash();
  window.addEventListener('hashchange',revealThroughHash);
  /* Anything injected into the page after load sits inside a section that may
     not have been revealed yet, and would render as a blank band. Exposed so a
     page that builds its own results can force its host section visible before
     showing them. */
  window.ERJReveal={now:showNow,ancestors:function(el){
    for(var n=el;n&&n!==document.body;n=n.parentNode){
      if(n.classList&&n.classList.contains('reveal'))showNow(n);
    }
  }};
  /* SAFETY SWEEP. The observer is the mechanism; this is the floor under it.
     Anything that has scrolled into view and is still invisible is revealed
     here, whatever the observer did or failed to do. It deliberately does NOT
     reveal the whole document on a timer \u2014 that would fade in content the
     reader has not reached yet and destroy the effect. Only what they can
     actually see. */
  var sweeping=false;
  function sweep(){
    sweeping=false;
    var vh=window.innerHeight||0;
    els.forEach(function(e){
      if(e.classList.contains('in'))return;
      var r=e.getBoundingClientRect();
      if(r.top<vh+120&&r.bottom>-120)showNow(e);
    });
  }
  function queueSweep(){ if(sweeping)return; sweeping=true; requestAnimationFrame(sweep); }
  window.addEventListener('scroll',queueSweep,{passive:true});
  window.addEventListener('resize',queueSweep);
  window.addEventListener('load',queueSweep);
  queueSweep();
  /* countdown */
  var pad=function(n){return String(n).padStart(2,'0');};
  var panels=[].slice.call(document.querySelectorAll('[data-deadline]')).map(function(p){
    return {el:p,closedLabel:p.dataset.closedLabel||'',done:false,
      deadline:new Date(p.dataset.deadline),nodes:{
      d:p.querySelector('[data-k="d"]'),h:p.querySelector('[data-k="h"]'),
      m:p.querySelector('[data-k="m"]'),s:p.querySelector('[data-k="s"]')}};
  }).filter(function(p){return p.nodes.d;});
  if(panels.length){
    var tick=function(){panels.forEach(function(p){
      var diff=p.deadline-new Date();
      if(diff<=0){
        diff=0;
        if(!p.done){
          p.done=true;
          p.el.classList.add('is-closed');
          if(p.closedLabel){
            var lbl=p.el.querySelector('[data-lbl]');
            if(!lbl){
              var scope=p.el.parentNode;
              while(scope&&scope!==document.body&&!lbl){lbl=scope.querySelector('[data-lbl]');scope=scope.parentNode;}
            }
            if(lbl)lbl.textContent=p.closedLabel;
          }
        }
      }
      var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),
          m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
      if(p.nodes.d)p.nodes.d.textContent=pad(d); if(p.nodes.h)p.nodes.h.textContent=pad(h);
      if(p.nodes.m)p.nodes.m.textContent=pad(m); if(p.nodes.s)p.nodes.s.textContent=pad(s);
    });};
    tick(); setInterval(tick,1000);
  }
  /* PWA */
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){navigator.serviceWorker.register(base+'sw.js').then(function(reg){reg.update();}).catch(function(){});});
    /* NO controllerchange -> location.reload() HERE. That listener is what made
       the home page white out for a few seconds mid-scroll: the worker takes
       control shortly after first load, controllerchange fires, and the page
       reloads under the reader — restoring scroll position, so it looks like a
       rendering glitch at whatever section they had reached rather than a
       reload. It was removed from all 16 HTML pages in v88, but this shared
       module carried its own duplicate and kept firing on the 12 pages that
       load it. The fetch handler is network-first for HTML, so a published
       change is already live on the next page view without any reload. */
  }
})();
