/* Shared theme toggle: day / night / system.
   RocketAir build → DEFAULT is NIGHT (pure black). 'system' follows OS.
   Sets html[data-theme="night"|"day"]. Persists to localStorage('rjt-theme').
   Wires any [data-erj-theme-btn], #themeToggle, #themeBtn. */
(function(){
  var KEY='rjt-theme', html=document.documentElement;
  var ICON={day:'\u2600\uFE0F',night:'\uD83C\uDF19',system:'\uD83D\uDCBB'};
  var NEXT={night:'day',day:'system',system:'night'};
  var TITLE={night:'Theme: Night (tap for Day)',day:'Theme: Day (tap for System)',system:'Theme: System (tap for Night)'};
  function sys(){return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'day' : 'night';}
  function bar(resolved){
    var m=document.getElementById('metaThemeColor')||document.querySelector('meta[name="theme-color"]:not([media])');
    if(!m){m=document.createElement('meta');m.name='theme-color';m.id='metaThemeColor';document.head.appendChild(m);}
    m.setAttribute('content', resolved==='day'?'#FAFAF8':'#000000');
  }
  function curPref(){ var p=localStorage.getItem(KEY); return ICON[p]?p:'night'; }   /* default night */
  function apply(pref){
    if(!ICON[pref]) pref='night';
    var resolved = pref==='system'? sys() : pref;
    html.setAttribute('data-theme', resolved);
    localStorage.setItem(KEY, pref); bar(resolved);
    document.querySelectorAll('[data-erj-theme-btn], #themeToggle, #themeBtn').forEach(function(btn){
      btn.textContent = ICON[pref]; btn.setAttribute('title', TITLE[pref]); btn.setAttribute('aria-label', TITLE[pref]);
    });
  }
  window.erjApplyTheme=apply;
  function wire(btn){
    if(!btn || btn.__erjWired) return; btn.__erjWired=true;
    btn.removeAttribute('onclick');
    var fresh=btn.cloneNode(true); btn.parentNode.replaceChild(fresh,btn);
    fresh.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); apply(NEXT[curPref()]); });
    fresh.style.cursor='pointer';
  }
  function wireAll(){ document.querySelectorAll('[data-erj-theme-btn], #themeToggle, #themeBtn').forEach(wire); }
  if(window.matchMedia){window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',function(){if(curPref()==='system')apply('system');});}
  /* Apply ASAP to avoid flash, then re-wire once nav injects its button. */
  apply(curPref());
  if(document.readyState!=='loading'){ wireAll(); apply(curPref()); }
  else document.addEventListener('DOMContentLoaded',function(){ wireAll(); apply(curPref()); });
  setTimeout(function(){ wireAll(); apply(curPref()); }, 300);
})();
