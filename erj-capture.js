"use strict";
/* ═══════════════════════════════════════════════════════════════
   EVERYTHING REMOTE JOB · CAPTURE LAYER  (erj-capture.ts)
   Compile:  tsc erj-capture.ts --target es2017 --strict --lib es2017,dom

   WHY THIS FILE EXISTS
   The two busiest free assets on this site produce no reachable
   people. A WhatsApp CHANNEL is one-way broadcast — no member list,
   no replies. The CV self-scan runs entirely on-device and stores
   nothing, deliberately. Both promises are worth keeping, so this
   layer does NOT break them. It adds one identified action the
   visitor CHOOSES to take: a prefilled WhatsApp message they send
   themselves. They keep their privacy; we get a conversation.

   Four jobs, all driven by window.ERJ_CONFIG:
     1. scan   — "Send me my scored report" on the CV scan result
     2. bridge — a reply route beside every one-way channel link
     3. evergreen — a door that opens today, under every countdown
     4. capacity — honest placement capacity, rendered from config
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const CFG = window.ERJ_CONFIG;
    if (!CFG)
        return;
    const base = (window.ERJ_NAV && typeof window.ERJ_NAV.base === 'string') ? window.ERJ_NAV.base : '';
    /* ── helpers ─────────────────────────────────────────────── */
    function fill(tpl, vars) {
        if (!vars)
            return tpl;
        return tpl.replace(/\{(\w+)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m);
    }
    function waLink(templateKey, vars) {
        const tpl = CFG.messages[templateKey] || '';
        return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(fill(tpl, vars));
    }
    function el(tag, cls, html) {
        const n = document.createElement(tag);
        if (cls)
            n.className = cls;
        if (html !== undefined)
            n.innerHTML = html;
        return n;
    }
    /* ── self-contained styling ───────────────────────────────
       blog.html and testimonials.html carry bespoke stylesheets and
       do NOT load product.css — but they DO define the same custom
       properties. So the capture components ship their own CSS and
       inherit the host page's tokens, with literal fallbacks for any
       page that defines neither. Injected once, guarded by id. */
    const CSS = `
.cap-btn{display:inline-flex;align-items:center;gap:.6rem;padding:.95rem 1.5rem;
 background:var(--accent,#FF5722);color:#fff;border:1px solid var(--accent,#FF5722);border-radius:2px;
 font-family:var(--font-display,system-ui,sans-serif);font-size:.82rem;font-weight:700;
 text-decoration:none;cursor:pointer;transition:transform .25s cubic-bezier(.22,1,.36,1),background .25s ease;}
.cap-btn:hover{background:var(--accent-h,#ff6f43);transform:translateY(-2px);}
.cap-btn svg{width:17px;height:17px;fill:currentColor;flex:0 0 auto;}
/* .small is 0.75rem — far below the 18.66px that white-on-orange needs to
   pass WCAG. So it drops the solid fill and becomes an orange outline,
   which reads with the same weight and passes contrast at any size. */
.cap-btn.small{padding:.7rem 1.1rem;font-size:.75rem;margin-top:1rem;
  background:transparent;color:var(--accent,#FF5722);border-color:var(--accent,#FF5722);}
.cap-btn.small:hover{background:var(--accent,#FF5722);color:#fff;}
.cap-btn.ghost{background:transparent;color:var(--ink,#fff);border-color:var(--line,rgba(128,128,128,.3));}
.cap-btn.ghost:hover{background:transparent;border-color:var(--accent,#FF5722);color:var(--accent,#FF5722);}
.cap-send{margin:2.2rem 0 .4rem;padding:1.5rem 1.6rem;background:var(--card,rgba(128,128,128,.06));
 border:1px solid var(--card-line,rgba(128,128,128,.2));border-left:3px solid var(--accent,#FF5722);border-radius:2px;}
.cap-note{margin-top:.9rem;font-size:.78rem;line-height:1.65;color:var(--ink-faint,#8a8a8a);max-width:56ch;}
.cap-note b{color:var(--ink-soft,#a1a1a1);font-weight:600;}
.cap-bridge{margin-top:.7rem;padding-left:.9rem;border-left:2px solid var(--accent,#FF5722);
 font-size:.84rem;line-height:1.6;}
.cap-bridge-k{display:block;font-size:.63rem;letter-spacing:.18em;text-transform:uppercase;
 color:var(--ink-faint,#8a8a8a);margin-bottom:.25rem;}
.cap-bridge a{color:var(--accent,#FF5722);font-weight:600;text-decoration:none;
 border-bottom:1px solid transparent;transition:border-color .2s ease;}
.cap-bridge a:hover{border-bottom-color:var(--accent,#FF5722);}
.evergreen{margin-top:1.6rem;padding:1.4rem 1.5rem;border:1px dashed var(--line,rgba(128,128,128,.3));
 border-radius:2px;background:var(--paper-2,rgba(128,128,128,.05));}
.eg-k{font-size:.63rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent,#FF5722);margin-bottom:.55rem;}
.eg-lead{font-size:.9rem;line-height:1.65;color:var(--ink-soft,#a1a1a1);}
.eg-lead b{color:var(--ink,#fff);font-weight:600;}
.eg-doors{display:flex;flex-wrap:wrap;gap:.6rem 1.6rem;margin-top:.9rem;}
/* When the block sits inside a centred section (register hero, home countdown),
   the kicker and lead already centre by inheritance — the flex row of doors did
   not, which left it visibly tilted to the left. eg-center is set in JS from the
   host's real computed text-align, so left-aligned pages are untouched. */
.evergreen.eg-center{text-align:center;}
.evergreen.eg-center .eg-lead{margin-left:auto;margin-right:auto;}
.evergreen.eg-center .eg-doors{justify-content:center;}
.eg-doors a{font-size:.82rem;font-weight:600;color:var(--accent,#FF5722);text-decoration:none;
 border-bottom:1px solid transparent;transition:border-color .2s ease;}
.eg-doors a:hover{border-bottom-color:var(--accent,#FF5722);}
.cap-bar{margin-top:1.6rem;padding:1.4rem 1.5rem;background:var(--card,rgba(128,128,128,.06));
 border:1px solid var(--card-line,rgba(128,128,128,.2));border-radius:2px;}
.cb-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem;}
.cb-k{font-size:.63rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent,#FF5722);}
.cb-n{font-size:.88rem;color:var(--ink-soft,#a1a1a1);}
.cb-n b{font-family:var(--font-display,system-ui,sans-serif);font-size:1.5rem;font-weight:800;
 color:var(--ink,#fff);margin-right:.15rem;}
.cb-track{height:5px;background:var(--line-soft,rgba(128,128,128,.15));border-radius:3px;
 overflow:hidden;margin:.9rem 0 .8rem;}
.cb-track span{display:block;height:100%;background:var(--accent,#FF5722);border-radius:3px;
 transition:width .8s cubic-bezier(.22,1,.36,1);}
.cb-why{font-size:.8rem;line-height:1.65;color:var(--ink-faint,#8a8a8a);max-width:60ch;}
.cap-read{margin-top:2.4rem;padding:1.8rem;background:var(--card,rgba(128,128,128,.06));
 border:1px solid var(--card-line,rgba(128,128,128,.2));border-top:3px solid var(--accent,#FF5722);border-radius:2px;}
.cr-k{font-family:var(--font-display,system-ui,sans-serif);font-weight:800;font-size:1.05rem;
 color:var(--ink,#fff);margin-bottom:.5rem;}
.cap-read p{font-size:.9rem;line-height:1.7;color:var(--ink-soft,#a1a1a1);max-width:62ch;}
.cr-actions{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.2rem;}
.cap-btn .arrow{display:inline-block;transition:transform .25s cubic-bezier(.22,1,.36,1);}
.cap-btn:hover .arrow{transform:translateX(4px);}
@media(prefers-reduced-motion:reduce){.cap-btn,.cb-track span,.cap-btn .arrow{transition:none;}}
`;
    function injectCss() {
        if (document.getElementById('erj-capture-css'))
            return;
        const style = document.createElement('style');
        style.id = 'erj-capture-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>';
    /* ═══ 1 · CV SCAN CAPTURE ═════════════════════════════════
       The scan re-renders whenever the job description changes, so
       the button is (re)injected by observer rather than once. We
       read the score straight out of the rendered DOM — the scan
       module keeps its own state private and we do not touch it. */
    function scanCapture() {
        const results = document.getElementById('results');
        if (!results)
            return;
        /* The guard below must look where the node actually LANDS. The button is
           inserted as a SIBLING before .results-actions, never inside it, so the
           old check (actions.querySelector) could never find it. Every insertion
           therefore re-fired this observer, which injected again, forever — an
           infinite loop that locked the main thread and produced Chrome's "Page
           Unresponsive" dialog the moment a CV finished parsing. The score dial
           animates its own text for ~900ms too, so the observer fires on every
           frame regardless; the guard has to be cheap and correct. */
        let mo = null;
        const inject = () => {
            const actions = results.querySelector('.results-actions');
            if (!actions || results.querySelector('.cap-send'))
                return;
            const dial = results.querySelector('.dial-num');
            const score = dial ? (dial.dataset.target || '0') : '0';
            const defaults = Array.from(results.querySelectorAll('.default-list li'))
                .map(li => (li.textContent || '').replace(/^\d+/, '').trim())
                .filter(Boolean);
            const href = defaults.length
                ? waLink('scan', { score: score, defaults: defaults.join('; ') })
                : waLink('scanClear', { score: score });
            const wrap = el('div', 'cap-send');
            wrap.innerHTML =
                '<a class="cap-btn" href="' + href + '" target="_blank" rel="noopener">' +
                    WA_ICON + '<span>Send me my scored report</span></a>' +
                    '<p class="cap-note">Your CV stays on this device \u2014 always. This only sends the ' +
                    '<b>number</b> and the point names, from your own WhatsApp, if you tap it. ' +
                    'You get the fix list back personally.</p>';
            // Stop watching while we mutate, so our own insertion cannot re-enter.
            if (mo)
                mo.disconnect();
            actions.parentNode.insertBefore(wrap, actions);
            if (mo)
                mo.observe(results, { childList: true, subtree: true });
        };
        mo = new MutationObserver(inject);
        inject();
        mo.observe(results, { childList: true, subtree: true });
    }
    /* ═══ 2 · CHANNEL BRIDGE ══════════════════════════════════
       Campaign rule only. "Jobs are the feed. Diagnosis is the next step."
       belongs in the internal conversion playbook, not in permanent public
       navigation or the Free For You menu. AUDIT remains available through
       diagnosis results, job-post footers, campaign posts and clinic flows. */
    function channelBridge() { return; }
    /* ═══ 3 · EVERGREEN DOORS ═════════════════════════════════
       A countdown tells a ready buyer to wait. Most who wait never
       return. Every countdown panel now names a door that is open
       today — the gate becomes one option, not the only one. */
    function evergreenDoors() {
        const panels = Array.from(document.querySelectorAll('[data-deadline]'));
        if (!panels.length)
            return;
        const seen = new Set();
        panels.forEach(panel => {
            if (panel.hasAttribute('data-no-evergreen'))
                return;
            const host = panel.closest('section, .timer-card, .cd-card, div') || panel;
            if (seen.has(host) || host.querySelector('.evergreen'))
                return;
            seen.add(host);
            const doors = CFG.evergreen.doors
                .map(d => '<a href="' + base + d.href + '">' + d.label + ' <span class="arrow">\u2192</span></a>')
                .join('');
            /* Follow the host's alignment. A centred hero (register.html) or a
               centred countdown section should centre the doors too; a
               left-aligned page must stay left. Read it, never assume it. */
            let centred = false;
            try {
                const ref = (panel.parentNode && panel.parentNode.nodeType === 1)
                    ? panel.parentNode : panel;
                centred = getComputedStyle(ref).textAlign === 'center';
            }
            catch (e) { }
            const box = el('div', 'evergreen reveal in' + (centred ? ' eg-center' : ''));
            box.innerHTML =
                '<div class="eg-k">Not waiting for a gate?</div>' +
                    '<p class="eg-lead"><b>' + CFG.evergreen.lead + '</b> ' + CFG.evergreen.body + '</p>' +
                    '<div class="eg-doors">' + doors + '</div>';
            panel.parentNode.insertBefore(box, panel.nextSibling);
        });
    }
    /* ═══ 4 · HONEST CAPACITY ═════════════════════════════════
       The placement promise costs human hours per student, so the
       scarcity is real. Any element with data-erj-capacity renders
       its live figure from config — one place to update. */
    function capacityLines() {
        const nodes = Array.from(document.querySelectorAll('[data-erj-capacity]'));
        if (!nodes.length)
            return;
        nodes.forEach(node => {
            const kind = node.dataset.erjCapacity === 'innercircle' ? 'innercircle' : 'placement';
            const total = kind === 'innercircle' ? CFG.capacity.innerCircleTotal : CFG.capacity.placementTotal;
            const taken = kind === 'innercircle' ? CFG.capacity.innerCircleTaken : CFG.capacity.placementTaken;
            const open = Math.max(0, total - taken);
            const noun = kind === 'innercircle' ? 'residency seats' : 'placement engagements';
            const why = kind === 'innercircle'
                ? 'The room co-applies with you in real time. That is a number of people, not a marketing figure.'
                : 'That is how many people we can source, apply and prep for while keeping the promise \u2014 not a marketing figure.';
            const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
            node.classList.add('cap-bar');
            node.innerHTML =
                '<div class="cb-head"><span class="cb-k">Live capacity</span>' +
                    '<span class="cb-n"><b>' + open + '</b> of ' + total + ' ' + noun + ' open</span></div>' +
                    '<div class="cb-track"><span style="width:' + pct + '%"></span></div>' +
                    '<p class="cb-why">' + why + ' When it fills, the honest answer is a waitlist \u2014 never a quieter promise.</p>' +
                    (open > 0
                        ? '<a class="cap-btn small" href="' + waLink('capacity') + '" target="_blank" rel="noopener">' +
                            WA_ICON + '<span>Ask for one of the open places</span></a>'
                        : '<a class="cap-btn small" href="' + waLink('capacity') + '" target="_blank" rel="noopener">' +
                            WA_ICON + '<span>Join the waitlist</span></a>');
        });
    }
    /* ═══ 5 · READING CTA ═════════════════════════════════════
       A reader who finishes something is warm for a few seconds.
       Any element with data-erj-cta gets one action — not a menu. */
    function readingCta() {
        const nodes = Array.from(document.querySelectorAll('[data-erj-cta]'));
        nodes.forEach(node => {
            if (node.querySelector('.cap-read'))
                return;
            const box = el('div', 'cap-read');
            box.innerHTML =
                '<div class="cr-k">Before you close this tab</div>' +
                    '<p>Score your CV free in 90 seconds \u2014 it runs on your own device \u2014 then send me the ' +
                    'number and I\u2019ll tell you the single fix that moves it most.</p>' +
                    '<div class="cr-actions">' +
                    '<a class="cap-btn" href="' + base + 'cvscan/">Score my CV free <span class="arrow">\u2192</span></a>' +
                    '<a class="cap-btn ghost" href="' + waLink('blog') + '" target="_blank" rel="noopener">' +
                    WA_ICON + '<span>Ask me where to start</span></a></div>';
            node.appendChild(box);
        });
    }
    /* ── boot ────────────────────────────────────────────────── */
    function boot() {
        try {
            injectCss();
        }
        catch (e) { /* never break the page */ }
        try {
            scanCapture();
        }
        catch (e) { }
        try {
            channelBridge();
        }
        catch (e) { }
        try {
            evergreenDoors();
        }
        catch (e) { }
        try {
            capacityLines();
        }
        catch (e) { }
        try {
            readingCta();
        }
        catch (e) { }
    }
    window.ERJ_CAPTURE = {
        waLink: waLink,
        refresh: boot
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    }
    else {
        boot();
    }
})();
