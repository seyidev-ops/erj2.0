"use strict";
/* ═══════════════════════════════════════════════════════
   ERJ UNIFIED NAVIGATION · v3 (TypeScript source)
   Compile: tsc erj-nav.ts --target es2017 --outFile erj-nav.js

   FIVE top-level items, everywhere:
     Home · Free For You ▾ · Your Starting Line ▾ ·
     Success Stories · Register
   Categories expand as accordions. The page you are ON is
   never listed as a plain standalone link — it renders as a
   "You are here" block carrying that page's section anchors,
   inside its own category.

   Each page sets, BEFORE this script loads:
     window.ERJ_NAV = {
       active: 'home'|'mastery'|'remote'|'inner'|'pricing'|
               'stories'|'blog'|'cvscan'|'diagnose'|'masterclass'|'login'|…,
       base:   '' (root) | '../' (one folder deep),
       portal: true          // admin/instructor surfaces only
       onPage: [{label,href,sub?}, …]   // optional anchors
     };
═══════════════════════════════════════════════════════ */
(() => {
    const cfg = window.ERJ_NAV || {};
    const active = cfg.active || '';
    const base = typeof cfg.base === 'string' ? cfg.base : '';
    const onPage = Array.isArray(cfg.onPage) ? cfg.onPage : [];
    const P = (href) => /^(https?:|mailto:|tel:|#|\/)/.test(href) ? href : base + href;
    const WA_CHANNEL = 'https://whatsapp.com/channel/0029Vaym4DE3mFY2wCrC713S';
    /* ── The five items. Each group's title is itself the link to its
          page; the chevron opens the sub-menu. Titles only — detail lives
          on the Free For You and Your Starting Line pages. ── */
    const MENU = [
        {
            key: 'home', label: 'Home', href: 'index.html', keys: ['home'], children: [
                { label: 'Meet Your Facilitator', href: 'index.html#facilitator' },
                { label: 'Four Problem · Fix It', href: 'index.html#joints' },
                { label: 'Proof It Works', href: 'index.html#story' },
                { label: 'The Promise', href: 'index.html#pledge' },
                { label: 'FAQ', href: 'index.html#faq' }
            ]
        },
        {
            key: 'g-free', label: 'Free For You', href: 'free.html', keys: ['free'], children: [
                { label: 'Find Your Leak · 4-point diagnostic', href: 'diagnose/', keys: ['diagnose'] },
                { label: '10-Point CV Self-Scan', href: 'cvscan/', keys: ['cvscan'] },
                { label: 'Free Live Masterclass', href: 'masterclass/', keys: ['masterclass'] },
                { label: 'Remote Career Blog', href: 'blog.html', keys: ['blog'] },
                { label: 'Global Job Board · WhatsApp', href: WA_CHANNEL, external: true }
            ]
        },
        {
            key: 'g-start', label: 'Your Starting Line', href: 'starting-line.html', keys: ['startline'], children: [
                { label: 'Self-Learn Pack · Stages 1\u20134', href: 'selflearn/', keys: ['selflearn'] },
                { label: 'Foundation Training · Stages 1–4', href: 'foundationtraining/', keys: ['mastery'] },
                { label: 'Job Application DFY · Done-For-You', href: 'jobapplication/', keys: ['remote'] },
                { label: 'Inner Circle · Residency', href: 'innercircle/', keys: ['inner'] }
            ]
        },
        { key: 'stories', label: 'Success Stories', href: 'testimonials.html', keys: ['stories', 'jobs'] },
        { key: 'pricing', label: 'Register', href: 'register.html', keys: ['pricing'] }
    ];
    /* Admin-side menu: the surfaces NOT open to the public live here,
       and only here — Surge Console, the gated CV Engine, the consoles. */
    const PORTAL_MENU = [
        { label: 'Participant Dashboard', href: 'dashboard.html' },
        { label: 'Admin Console', href: 'admin.html' },
        { label: 'Instructor Console', href: 'instructor.html' },
        { label: 'Blog Admin', href: 'blog-admin.html' },
        { label: 'Surge Console', href: 'erj-surge-console.html' },
        { label: 'CV Engine · gated', href: 'cvbuilder/' },
        { label: 'CV Self-Scan · public tool', href: 'cvscan/' },
        { label: 'Back to Website', href: 'index.html' }
    ];
    const IS_PORTAL = !!cfg.portal;
    const matches = (keys) => !!active && !!keys && keys.indexOf(active) !== -1;
    /* ── styles (injected once) ── */
    const css = [
        'html{scroll-padding-top:var(--erj-nav-h,64px);overflow-x:clip;}',
        '.erj-nav,.erj-panel,.erj-scrim{--enInk:var(--ink,#fff);--enPaper:var(--paper,#000);',
        '--enAccent:var(--accent,#FF5722);--enFaint:var(--ink-faint,#8a8a8a);--enSoft:var(--ink-soft,#a1a1a1);',
        '--enLine:var(--line,rgba(255,255,255,0.10));}',
        '.erj-nav{font-family:var(--font-body,system-ui,sans-serif);position:fixed;top:0;left:0;right:0;z-index:1000;',
        'display:flex;align-items:center;justify-content:space-between;gap:1rem;',
        'padding:0.7rem clamp(1.1rem,4vw,2.2rem);background:var(--enPaper);',
        'border-bottom:1px solid var(--enLine);box-shadow:0 1px 0 var(--enLine),0 6px 24px -18px rgba(0,0,0,0.5);}',
        '.erj-nav *{box-sizing:border-box;}',
        '.erj-brand{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-display,"Space Grotesk",system-ui,sans-serif);',
        'font-weight:700;font-size:1rem;color:var(--enInk);letter-spacing:-0.3px;text-decoration:none;flex-shrink:0;}',
        '.erj-brand img{width:31px;height:30px;display:block;object-fit:contain;}',
        /* Default is night, which is what <html data-theme="night"> ships as,
           so the light mark stays hidden until the theme actually changes.

           These selectors are scoped to .erj-brand deliberately. A bare
           '.erj-mark-day' is specificity (0,1,0) and loses to the
           '.erj-brand img' rule above at (0,1,1) — which showed BOTH marks
           side by side in night theme. Matching the specificity fixes it. */
        '.erj-brand .erj-mark-day{display:none;}',
        'html[data-theme="day"] .erj-brand .erj-mark-night{display:none;}',
        'html[data-theme="day"] .erj-brand .erj-mark-day{display:block;}',
        '.erj-brand b{font-weight:700;}.erj-brand i{font-style:italic;color:var(--enAccent);font-weight:700;margin-left:-0.08em;}',
        '.erj-right{display:flex;align-items:center;gap:0.55rem;flex-shrink:0;}',
        '.erj-icon{width:40px;height:40px;flex-shrink:0;border-radius:9px;background:transparent;border:1px solid var(--enLine);',
        'color:var(--enInk);font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;',
        'transition:border-color .2s;line-height:1;}',
        '.erj-icon:hover{border-color:var(--enAccent);}',
        '.erj-burger svg{width:20px;height:20px;}',
        /* ── DESKTOP BAR (>=980px): the five items spread across the header ── */
        '.erj-bar{display:none;align-items:center;gap:0.15rem;margin-left:auto;margin-right:0.6rem;}',
        '.erj-bar-item{position:relative;display:flex;align-items:center;}',
        '.erj-bar-link{display:inline-flex;align-items:center;gap:0.3rem;color:var(--enInk);text-decoration:none;',
        'font-size:0.88rem;font-weight:600;letter-spacing:-0.1px;padding:0.55rem 0.7rem;border-radius:8px;',
        'white-space:nowrap;transition:background .15s,color .15s;}',
        '.erj-bar-link:hover{background:var(--enLine);color:var(--enAccent);}',
        '.erj-bar-item.is-current>.erj-bar-link{color:var(--enAccent);}',
        '.erj-bar-item.is-current>.erj-bar-link::before{content:"";width:6px;height:6px;border-radius:50%;',
        'background:var(--enAccent);margin-right:0.15rem;flex-shrink:0;}',
        '.erj-bar-chev{background:transparent;border:0;color:var(--enFaint);cursor:pointer;font-size:0.6rem;',
        'padding:0.55rem 0.4rem 0.55rem 0;line-height:1;transition:transform .22s,color .2s;}',
        '.erj-bar-item.open .erj-bar-chev{transform:rotate(180deg);color:var(--enAccent);}',
        '.erj-bar-item:hover .erj-bar-chev{color:var(--enAccent);}',
        '.erj-drop{position:absolute;top:calc(100% + 0.55rem);left:0;min-width:250px;background:var(--enPaper);',
        'border:1px solid var(--enLine);border-radius:12px;padding:0.4rem;z-index:1010;',
        'box-shadow:0 18px 44px -20px rgba(0,0,0,0.75);display:none;}',
        '.erj-bar-item.open .erj-drop{display:block;}',
        '.erj-drop a{display:block;color:var(--enSoft);font-size:0.85rem;text-decoration:none;padding:0.55rem 0.7rem;',
        'border-radius:8px;white-space:nowrap;transition:background .15s,color .15s;}',
        '.erj-drop a:hover{background:var(--enLine);color:var(--enAccent);}',
        '.erj-drop a.is-current{color:var(--enAccent);font-weight:700;}',
        '.erj-drop a.is-current::before{content:"\u2022 ";}',
        '.erj-drop .erj-drop-anchors{border-top:1px solid var(--enLine);margin-top:0.3rem;padding-top:0.3rem;}',
        '.erj-drop .erj-drop-anchors a{font-size:0.8rem;color:var(--enFaint);}',
        /* Pinned so the bar's height never depends on which font has finished
           loading. Pages reserve exactly this much room up front, which is why
           nothing jumps when the nav mounts. Change one, change the other:
           the reservation lives in each page's <style id="erjNavReserve">. */
        '.erj-nav{min-height:63px;}',
        '@media(min-width:980px){.erj-nav{min-height:65px;}}',
        '@media(min-width:980px){.erj-bar{display:flex;}.erj-burger{display:none;}}',
        /* ── MOBILE DRAWER (<980px) ── */
        '.erj-panel{position:fixed;top:0;right:0;bottom:0;width:min(86vw,380px);z-index:1100;',
        'background:var(--enPaper);border-left:1px solid var(--enLine);box-shadow:-16px 0 50px rgba(0,0,0,0.22);',
        'overflow-y:auto;transform:translateX(100%);transition:transform .32s cubic-bezier(0.22,1,0.36,1);',
        'display:flex;flex-direction:column;visibility:hidden;}',
        '.erj-panel.open{transform:translateX(0);visibility:visible;}',
        '.erj-panel-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;',
        'padding:1.1rem 1.3rem;border-bottom:1px solid var(--enLine);position:sticky;top:0;background:var(--enPaper);z-index:2;}',
        '.erj-panel-title{font-size:0.66rem;letter-spacing:2.5px;text-transform:uppercase;color:var(--enFaint);font-weight:500;}',
        '.erj-panel-x{width:34px;height:34px;border-radius:8px;background:transparent;border:1px solid var(--enLine);',
        'color:var(--enInk);font-size:1.05rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
        '.erj-panel-x:hover{border-color:var(--enAccent);}',
        '.erj-list{display:flex;flex-direction:column;gap:0;margin:0;padding:0.6rem 0.8rem 1.5rem;}',
        '.erj-row{display:flex;align-items:center;gap:0.2rem;}',
        '.erj-link{flex:1;display:flex;align-items:center;gap:0.4rem;color:var(--enInk);',
        'font-family:var(--font-display,"Space Grotesk",system-ui,sans-serif);font-size:1.14rem;font-weight:600;letter-spacing:-0.3px;',
        'text-decoration:none;padding:0.85rem 0.6rem;border-radius:8px;transition:background .15s,color .15s;}',
        '.erj-link:hover{background:var(--enLine);}',
        /* the title itself IS the location marker */
        '.erj-item.is-current>.erj-row>.erj-link,.erj-item.is-current>.erj-link{color:var(--enAccent);}',
        '.erj-item.is-current>.erj-row>.erj-link::before,.erj-item.is-current>.erj-link::before{content:"";',
        'width:7px;height:7px;border-radius:50%;background:var(--enAccent);flex-shrink:0;}',
        '.erj-chev{background:transparent;border:0;color:var(--enFaint);cursor:pointer;font-size:0.7rem;',
        'padding:0.9rem 0.7rem;line-height:1;border-radius:8px;transition:transform .25s,color .2s;}',
        '.erj-chev:hover{color:var(--enAccent);background:var(--enLine);}',
        '.erj-item.open .erj-chev{transform:rotate(180deg);color:var(--enAccent);}',
        '.erj-kids{display:none;padding:0.1rem 0 0.5rem 0.55rem;margin-left:0.35rem;border-left:2px solid var(--enLine);}',
        '.erj-item.open .erj-kids{display:block;}',
        '.erj-sub-item{display:block;text-decoration:none;color:var(--enSoft);font-size:0.9rem;font-weight:500;',
        'padding:0.55rem 0.65rem;border-radius:8px;transition:background .15s,color .15s;}',
        '.erj-sub-item:hover{background:var(--enLine);color:var(--enAccent);}',
        '.erj-sub-item.is-current{color:var(--enAccent);font-weight:700;}',
        '.erj-sub-item.is-current::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;',
        'background:var(--enAccent);margin-right:0.45rem;vertical-align:middle;}',
        '.erj-anchors{display:flex;flex-direction:column;padding:0.1rem 0 0.3rem 0.2rem;margin:0;}',
        '.erj-sub-item+.erj-anchors{padding-left:0.7rem;border-left:1px solid var(--enLine);margin:0.1rem 0 0.2rem;}',
        '.erj-anchors a{display:block;color:var(--enFaint);font-size:0.82rem;text-decoration:none;',
        'padding:0.4rem 0.6rem;border-radius:7px;transition:background .15s,color .15s;}',
        '.erj-anchors a:hover{background:var(--enLine);color:var(--enAccent);}',
        '.erj-anchors a.is-here{color:var(--enAccent);}',
        '.f-stop.is-here .no{opacity:1;}.f-stop.is-here .lbl{color:var(--enAccent);}',
        '.erj-scrim{position:fixed;inset:0;z-index:1090;background:rgba(0,0,0,0.42);opacity:0;visibility:hidden;',
        'transition:opacity .3s,visibility .3s;}',
        '.erj-scrim.open{opacity:1;visibility:visible;}',
        '@media(max-width:400px){.erj-nav{gap:0.5rem;padding-left:0.85rem;padding-right:0.85rem;}',
        '.erj-brand{flex-shrink:1;min-width:0;font-size:0.9rem;gap:7px;overflow:hidden;white-space:nowrap;letter-spacing:-0.3px;}',
        '.erj-brand img{width:26px;height:26px;}.erj-right{gap:0.3rem;}.erj-icon{width:36px;height:36px;}}',
        '@media(prefers-reduced-motion:reduce){.erj-panel,.erj-scrim,.erj-chev,.erj-bar-chev{transition:none;}}'
    ].join('');
    const style = document.createElement('style');
    style.id = 'erjNavCSS';
    style.textContent = css;
    document.head.appendChild(style);
    /* ── render helpers ── */
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const extAttr = (c) => (c.external ? ' target="_blank" rel="noopener"' : '');
    /* The page's own section anchors. Rendered UNDER whichever title is the
       current location — the title itself is the "you are here", so there is
       never a duplicate label repeating it. */
    function anchorList(cls) {
        if (!onPage.length)
            return '';
        return '<div class="' + cls + '">' +
            onPage.map(a => '<a href="' + P(a.href) + '">' + esc(a.label) + '</a>').join('') +
            '</div>';
    }
    /* ── DESKTOP BAR ── */
    function buildBar() {
        return MENU.map(top => {
            const selfCurrent = matches(top.keys);
            const childCurrent = !!top.children && top.children.some(c => matches(c.keys));
            const isCurrent = selfCurrent || childCurrent;
            let html = '<div class="erj-bar-item' + (isCurrent ? ' is-current' : '') +
                '" data-bar="' + top.key + '">' +
                '<a class="erj-bar-link" href="' + P(top.href || '#') + '"' +
                (selfCurrent ? ' aria-current="page"' : '') + '>' + esc(top.label) + '</a>';
            if (top.children) {
                const drop = selfCurrent
                    ? anchorList('erj-drop-anchors') /* on its own page: sections only */
                    : top.children.map(c => '<a href="' + P(c.href) + '"' + extAttr(c) +
                        (matches(c.keys) ? ' class="is-current" aria-current="page"' : '') + '>' +
                        esc(c.label) + '</a>').join('') +
                        (childCurrent ? anchorList('erj-drop-anchors') : '');
                html += '<button type="button" class="erj-bar-chev" aria-label="Open ' + esc(top.label) +
                    ' menu" aria-expanded="false">\u25BC</button><div class="erj-drop">' + drop + '</div>';
            }
            return html + '</div>';
        }).join('');
    }
    /* ── top bar ── */
    const nav = document.createElement('header');
    nav.className = 'erj-nav';
    nav.innerHTML =
        '<a href="' + P('index.html') + '" class="erj-brand">' +
            /* Both marks ship; CSS shows one. Swapping an img src on the theme
               toggle means a network fetch mid-click and a blink where the logo
               used to be — this way the correct one is already decoded and the
               switch is instant. Same geometry, so nothing shifts. */
            '<img class="erj-mark erj-mark-night" src="' + P('erj-mark-dark.png') + '" alt="ERJ" width="31" height="30">' +
            '<img class="erj-mark erj-mark-day" src="' + P('erj-mark-light.png') + '" alt="" aria-hidden="true" width="31" height="30">' +
            '<b>Everything</b><i>RemoteJob</i></a>' +
            (IS_PORTAL ? '' : '<nav class="erj-bar" aria-label="Main menu">' + buildBar() + '</nav>') +
            '<div class="erj-right">' +
            '<button class="erj-icon" data-erj-theme-btn title="Toggle theme" aria-label="Toggle theme">\uD83C\uDF19</button>' +
            '<button class="erj-icon erj-burger" id="erjBurger" aria-label="Open menu" aria-haspopup="true" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
            '<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>' +
            '</button></div>';
    /* On portal pages the burger is the only menu at every width. */
    if (IS_PORTAL) {
        const pcss = document.createElement('style');
        pcss.textContent = '@media(min-width:980px){.erj-burger{display:flex;}}';
        document.head.appendChild(pcss);
    }
    /* ── MOBILE DRAWER ── */
    function childRow(c) {
        const cur = matches(c.keys);
        return '<a class="erj-sub-item' + (cur ? ' is-current' : '') + '" href="' + P(c.href) + '"' +
            extAttr(c) + (cur ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</a>' +
            (cur ? anchorList('erj-anchors') : '');
    }
    function buildItems() {
        if (IS_PORTAL) {
            return PORTAL_MENU.map(c => '<div class="erj-item"><a class="erj-link" href="' + P(c.href) + '">' +
                esc(c.label) + '</a></div>').join('');
        }
        return MENU.map(top => {
            const selfCurrent = matches(top.keys);
            const childCurrent = !!top.children && top.children.some(c => matches(c.keys));
            const isCurrent = selfCurrent || childCurrent;
            const link = '<a class="erj-link" href="' + P(top.href || '#') + '"' +
                (selfCurrent ? ' aria-current="page"' : '') + '>' + esc(top.label) + '</a>';
            if (!top.children) {
                return '<div class="erj-item' + (selfCurrent ? ' is-current' : '') + '">' + link +
                    (selfCurrent ? anchorList('erj-anchors') : '') + '</div>';
            }
            /* Group: title links to its page, chevron opens the sub-menu.
               When the group's OWN page is current, its anchors sit directly
               under the title; when a child is current, they sit under that child. */
            const kids = selfCurrent
                ? anchorList('erj-anchors') /* on its own page: sections only */
                : top.children.map(childRow).join(''); /* elsewhere: the child pages */
            return '<div class="erj-item' + (isCurrent ? ' open' : '') +
                (selfCurrent ? ' is-current' : '') + '" data-group="' + top.key + '">' +
                '<div class="erj-row">' + link +
                '<button type="button" class="erj-chev" aria-label="Open ' + esc(top.label) +
                ' menu" aria-expanded="' + (isCurrent ? 'true' : 'false') + '">\u25BC</button></div>' +
                '<div class="erj-kids">' + kids + '</div>' +
                '</div>';
        }).join('');
    }
    const scrim = document.createElement('div');
    scrim.className = 'erj-scrim';
    scrim.id = 'erjScrim';
    const panel = document.createElement('aside');
    panel.className = 'erj-panel';
    panel.id = 'erjPanel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
        '<div class="erj-panel-head"><span class="erj-panel-title">Menu</span>' +
            '<button class="erj-panel-x" id="erjPanelX" aria-label="Close menu">\u2715</button></div>' +
            '<nav class="erj-list" aria-label="Site menu">' + buildItems() + '</nav>';
    function setOffset() {
        const h = nav.offsetHeight || 58;
        document.body.style.paddingTop = h + 'px';
        document.documentElement.style.setProperty('--erj-nav-h', h + 'px');
    }
    function wire() {
        const burger = document.getElementById('erjBurger');
        const open = () => {
            panel.classList.add('open');
            scrim.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            if (burger)
                burger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            panel.classList.remove('open');
            scrim.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
            if (burger)
                burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };
        if (burger)
            burger.addEventListener('click', open);
        const x = document.getElementById('erjPanelX');
        if (x)
            x.addEventListener('click', close);
        scrim.addEventListener('click', close);
        panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        /* Drawer accordion: opening one group closes the others. */
        const groups = panel.querySelectorAll('.erj-item[data-group]');
        panel.querySelectorAll('.erj-chev').forEach(btn => {
            btn.addEventListener('click', () => {
                const g = btn.closest('.erj-item');
                if (!g)
                    return;
                const willOpen = !g.classList.contains('open');
                groups.forEach(other => {
                    other.classList.remove('open');
                    const c = other.querySelector('.erj-chev');
                    if (c)
                        c.setAttribute('aria-expanded', 'false');
                });
                if (willOpen) {
                    g.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
        /* Desktop dropdowns: one at a time, close on outside click or Escape. */
        const barItems = nav.querySelectorAll('.erj-bar-item');
        const closeBar = () => {
            barItems.forEach(it => {
                it.classList.remove('open');
                const c = it.querySelector('.erj-bar-chev');
                if (c)
                    c.setAttribute('aria-expanded', 'false');
            });
        };
        nav.querySelectorAll('.erj-bar-chev').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const it = btn.closest('.erj-bar-item');
                if (!it)
                    return;
                const willOpen = !it.classList.contains('open');
                closeBar();
                if (willOpen) {
                    it.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
        document.addEventListener('click', e => {
            if (!nav.contains(e.target))
                closeBar();
        });
        nav.querySelectorAll('.erj-drop a').forEach(a => a.addEventListener('click', closeBar));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                close();
                closeBar();
            }
        });
    }
    function mount() {
        const slot = document.getElementById('erjNavMount');
        if (slot && slot.parentNode)
            slot.parentNode.replaceChild(nav, slot);
        else
            document.body.insertBefore(nav, document.body.firstChild);
        /* setOffset() reads nav.offsetHeight, which forces a synchronous layout.
           Running it here — inside mount, before first paint — cost 64 ms on a
           throttled phone. The nav height is already reserved in CSS (59 px
           mobile / 65 px desktop), so nothing moves if the browser paints first
           and we correct the reserved value once the page has settled.
           Every consumer of --erj-nav-h carries its own fallback, so nothing
           depends on this having run. */
        window.addEventListener('load', setOffset);
        window.addEventListener('resize', setOffset);
        if (document.fonts && document.fonts.ready)
            document.fonts.ready.then(setOffset);
        document.body.appendChild(scrim);
        document.body.appendChild(panel);
        wire();
        if (window.erjApplyTheme) {
            try {
                window.erjApplyTheme(localStorage.getItem('rjt-theme') || 'system');
            }
            catch (e) { /* noop */ }
        }
    }
    /* ── in-page tour, rendered from the SAME onPage array ── */
    function mountTour() {
        const hosts = document.querySelectorAll('[data-erj-tour]');
        if (!hosts.length || !onPage.length)
            return;
        const title = cfg.tourTitle || 'On this page';
        let html = '<div class="f-tour-t">' + title + '</div><div class="f-stops">';
        onPage.forEach((st, i) => {
            const no = i + 1 < 10 ? '0' + (i + 1) : '' + (i + 1);
            html += '<a class="f-stop" href="' + st.href + '" data-tour-target="' + st.href + '">' +
                '<span class="no">' + no + '</span><span class="lbl">' + st.label +
                (st.sub ? '<small>' + st.sub + '</small>' : '') +
                '</span><span class="go">\u2192</span></a>';
        });
        html += '</div>';
        if (cfg.tourSkip) {
            html += '<a class="f-tour-skip" href="' + cfg.tourSkip.href + '">' +
                cfg.tourSkip.label + ' <span>\u2192</span></a>';
        }
        hosts.forEach(h => { h.innerHTML = html; });
        spyTour();
    }
    /* Highlight the section the reader is inside — tour + drawer anchors. */
    function spyTour() {
        const els = [];
        const seen = {};
        onPage.forEach(s => {
            const h = s.href;
            if (!h || h.charAt(0) !== '#' || seen[h])
                return;
            const el = document.getElementById(h.slice(1));
            if (el) {
                el.setAttribute('data-tour-id', h);
                els.push(el);
                seen[h] = 1;
            }
        });
        if (!els.length || !('IntersectionObserver' in window))
            return;
        const visible = {};
        const paint = () => {
            let cur = null;
            for (const el of els) {
                const h = el.getAttribute('data-tour-id') || '';
                if (visible[h]) {
                    cur = h;
                    break;
                }
            }
            if (!cur)
                return;
            document.querySelectorAll('[data-tour-target],.erj-anchors a').forEach(a => {
                const href = a.getAttribute('data-tour-target') || a.getAttribute('href');
                if (href === cur)
                    a.classList.add('is-here');
                else
                    a.classList.remove('is-here');
            });
        };
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => { visible[en.target.getAttribute('data-tour-id') || ''] = en.isIntersecting; });
            paint();
        }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
        els.forEach(el => io.observe(el));
    }
    const mountAll = () => { mount(); try {
        mountTour();
    }
    catch (e) { /* noop */ } };
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', mountAll);
    else
        mountAll();
})();
/* ── Tour navigator: floating up/down arrows stepping through
      ERJ_NAV.onPage anchors. Mounts on pages with 2+ stops. ── */
(() => {
    function mount() {
        const nav = window.ERJ_NAV;
        if (!nav || nav.portal || !Array.isArray(nav.onPage))
            return;
        const stops = nav.onPage
            .filter(s => s && s.href && s.href.charAt(0) === '#')
            .map(s => document.querySelector(s.href))
            .filter((el) => !!el);
        if (stops.length < 2)
            return;
        const css = document.createElement('style');
        css.textContent =
            '.erj-tournav{position:fixed;left:clamp(0.6rem,1.6vw,1.1rem);top:50%;transform:translateY(-50%);' +
                'display:flex;flex-direction:column;gap:0.45rem;z-index:190;}' +
                '.erj-tournav button{width:38px;height:38px;border-radius:50%;border:1px solid var(--card-line,rgba(128,128,128,.28));' +
                'background:var(--card,#111);color:var(--ink,#fff);cursor:pointer;display:flex;align-items:center;justify-content:center;' +
                'box-shadow:0 6px 20px rgba(0,0,0,.28);transition:transform .25s,border-color .25s,opacity .3s;padding:0;opacity:.55;}' +
                '.erj-tournav:hover button,.erj-tournav button:focus-visible{opacity:1;}' +
                '.erj-tournav button:hover{transform:scale(1.08);border-color:var(--accent,#FF5722);opacity:1;}' +
                '.erj-tournav button:focus-visible{outline:2px solid var(--accent,#FF5722);outline-offset:2px;}' +
                '.erj-tournav button svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}' +
                '.erj-tournav button[disabled]{opacity:.16;cursor:default;transform:none;}' +
                '@media(max-width:768px){.erj-tournav{gap:0.4rem;left:0.5rem;}' +
                '.erj-tournav button{width:33px;height:33px;box-shadow:0 4px 14px rgba(0,0,0,.24);}' +
                '.erj-tournav button svg{width:13px;height:13px;}}' +
                '@media(max-width:380px){.erj-tournav{display:none;}}';
        document.head.appendChild(css);
        const box = document.createElement('div');
        box.className = 'erj-tournav';
        box.setAttribute('aria-label', 'Tour navigation');
        box.innerHTML =
            '<button type="button" data-dir="-1" aria-label="Previous section" title="Previous section">' +
                '<svg viewBox="0 0 24 24"><polyline points="6 15 12 9 18 15"></polyline></svg></button>' +
                '<button type="button" data-dir="1" aria-label="Next section" title="Next section">' +
                '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg></button>';
        document.body.appendChild(box);
        const upBtn = box.children[0];
        const downBtn = box.children[1];
        const OFFSET = 84;
        const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        /* Cached: this ran getBoundingClientRect() for every stop on every scroll
           frame, forcing a re-layout each time. Recompute on resize instead. */
        let _tops = null;
        const tops = () => (_tops || (_tops = stops.map(el => el.getBoundingClientRect().top + window.pageYOffset - OFFSET)));
        window.addEventListener('resize', () => { _tops = null; }, { passive: true });
        const currentIndex = () => {
            const y = window.pageYOffset;
            const t = tops();
            let idx = -1;
            for (let i = 0; i < t.length; i++)
                if (y >= t[i] - 4)
                    idx = i;
            return idx;
        };
        /* On the very first sync — which happens during load, before the user
           has scrolled anywhere — we deliberately do NOT call currentIndex().
           It measures every scroll stop on the page with getBoundingClientRect,
           forcing a full layout: 92 ms on a throttled phone, spent working out
           something we already know (at the top of the page, "down" is always
           available). Measure on the first real scroll instead. */
        let _measured = false;
        const sync = () => {
            const atTop = window.pageYOffset < 8;
            upBtn.disabled = atTop;
            if (!_measured && atTop) {
                downBtn.disabled = stops.length === 0;
                return;
            }
            _measured = true;
            downBtn.disabled = currentIndex() >= stops.length - 1;
        };
        const go = (dir) => {
            const idx = currentIndex();
            let next = Math.min(stops.length - 1, Math.max(0, idx + dir));
            if (idx === -1 && dir === 1)
                next = 0;
            if (idx === -1 && dir === -1) {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                return;
            }
            if (idx === 0 && dir === -1) {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                sync();
                return;
            }
            window.scrollTo({ top: tops()[next], behavior: reduced ? 'auto' : 'smooth' });
            setTimeout(sync, 350);
        };
        upBtn.addEventListener('click', () => go(-1));
        downBtn.addEventListener('click', () => go(1));
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking)
                return;
            ticking = true;
            requestAnimationFrame(() => { sync(); ticking = false; });
        }, { passive: true });
        /* Not sync() — even reading window.pageYOffset here forces the browser
           to finish laying out the page before it can answer, and that cost
           108 ms during load. The honest starting state needs no measurement:
           a page opens at the top, so "up" is off and "down" is on. The first
           scroll, or the load event, corrects it. */
        upBtn.disabled = true;
        downBtn.disabled = stops.length === 0;
        window.addEventListener('load', () => { requestAnimationFrame(sync); }, { once: true });
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', mount);
    else
        mount();
})();
