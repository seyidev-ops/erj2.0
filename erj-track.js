/* ═══════════════════════════════════════════════════════════════
   EVERYTHING REMOTE JOB · TRACKING LAYER
   Meta Pixel + Google Tag Manager, in one file.

   ───────────────────────────────────────────────────────────────
   LIVE.  Meta Pixel 1254236807775121  ·  GTM-NMFHS59B
   Loaded from every public page. Edit the CONFIG block below and
   nothing else on the site needs to change.
   ───────────────────────────────────────────────────────────────

   WHAT IT SENDS
     PageView          every page
     ViewContent       product pages (see PRODUCT_PAGES)
     Lead              any click on a WhatsApp link
     Contact           click on the free WhatsApp job channel
     InitiateCheckout  any click on a Selar or Paystack link,
                       with the correct naira value attached
     Purchase          NOT sent from here — checkout happens off
                       site on selar.com / paystack.shop. Connect
                       the pixel inside Selar: Menu → Integrations.

   EVERY EVENT GOES TO BOTH
     Meta   as the standard event name above
     GTM    as a dataLayer Custom Event, prefixed erj_ —
              erj_view_item · erj_generate_lead ·
              erj_begin_checkout · erj_contact
            Build your GA4 / TikTok / LinkedIn tags off those
            inside tagmanager.google.com. You should never need
            to edit this file again to add a new tag.

   dataLayer variables available to GTM on every event:
     erj_event · erj_name · erj_value · erj_currency ·
     erj_method · erj_link

   Manual firing, from anywhere:
     erjTrack('Lead', { content_name: 'Masterclass signup' });
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONFIG — THE ONLY PART YOU EDIT
     ═══════════════════════════════════════════════════════════ */
  var CFG = {

    /* ── 1. Meta Pixel — "Everything Remote Job". LIVE. ─────────*/
    metaPixelId: '1254236807775121',

    /* ── 2. Google Tag Manager container. LIVE. ────────────────
          GA4, TikTok, LinkedIn and anything else are configured
          INSIDE GTM at tagmanager.google.com — you never need to
          touch this file again to add another tag.             */
    gtmId: 'GTM-NMFHS59B',

    /* ── 3. Optional: a direct GA4 Measurement ID (G-XXXXXXXXXX).
          Leave this as-is if GA4 is configured inside GTM, which
          is the normal setup. Filling BOTH in would double-count
          every pageview.                                        */
    ga4Id: 'PASTE_GA4_MEASUREMENT_ID',

    /* ── 4. Set true to see every event in the browser console
          while you test. Set back to false before you rely on
          the numbers — it does not stop sending, it only logs. */
    debug: false,

    /* ── 5. Honour the browser's Do Not Track setting. Leave
          true unless you have a specific reason.               */
    respectDoNotTrack: true
  };

  /* ═══════════════════════════════════════════════════════════
     Below this line you should not need to edit anything.
     ═══════════════════════════════════════════════════════════ */

  /* ── Checkout links → what they cost, so the pixel can report
        real money rather than a bare event count. Add a line here
        whenever you create a new Paystack or Selar link. ─────── */
  var CHECKOUTS = {
    'selar.com/77v230274x':               { value: 35000,  name: 'Self-Learn Pack (Stages 1-4)' },
    'paystack.shop/pay/Stage1':           { value: 70000,  name: 'Stage 1 - Remote Mindset Blueprint' },
    'paystack.shop/pay/stage2ai':         { value: 130000, name: 'Stage 2 - Digital Toolkit' },
    'paystack.shop/pay/stage3alony':      { value: 70000,  name: 'Stage 3 - Async Communication' },
    'paystack.shop/pay/stage4only':       { value: 100000, name: 'Stage 4 - Global Ready Package' },
    'paystack.shop/pay/rjmtstages1-4':    { value: 250000, name: 'Foundation Training (Stages 1-4)' },
    'paystack.shop/pay/earlybirdstages1-4': { value: 200000, name: 'Foundation Training (Early Bird)' },
    'paystack.shop/pay/dfy7days':         { value: 50000,  name: 'Job Hunt & Application DFY (7 Days)' },
    'paystack.shop/pay/gtdj-stage5':      { value: 300000, name: 'Stage 5 - Placement Engine' },
    'paystack.shop/pay/gydjo-stages1-5':  { value: 500000, name: 'Dream Job Offer (Stages 1-5)' },
    'paystack.shop/pay/erj-inner-circle': { value: 250000, name: 'The Inner Circle' },
    'paystack.shop/pay/erj-cvpass':       { value: 5000,   name: 'CV Engine Pass (30 days)' },
  };

  /* ── Pages worth a ViewContent. Matched on the end of the path,
        so it works from any folder depth. ───────────────────── */
  var PRODUCT_PAGES = [
    { match: '/selflearn/',                          name: 'Self-Learn Pack',        value: 35000 },
    { match: '/jobapplication/',                     name: 'Job Application DFY',    value: 50000 },
    { match: '/foundationtraining/',                 name: 'Foundation Training',    value: 250000 },
    { match: '/innercircle/',                        name: 'Inner Circle',           value: 250000 },
    { match: '/register.html',                       name: 'Register - all offers',  value: 250000 },
    { match: '/earlybird.html',                      name: 'Early Bird',             value: 200000 },
    { match: '/self-learn-vs-foundation-training.html', name: 'Self-Learn vs Foundation', value: 35000 },
    { match: '/masterclass/',                        name: 'Free Masterclass',       value: 0 },
    { match: '/cvscan/',                             name: 'Free CV Scan',           value: 0 },
    { match: '/cvbuilder/',                          name: 'Free CV Builder',        value: 0 },
    { match: '/diagnose/',                           name: 'Free Diagnosis',         value: 0 },
    { match: '/testimonials.html',                   name: 'Success Stories',        value: 0 }
  ];

  var CURRENCY   = 'NGN';
  var UNSET      = /PASTE_|XXXX|^$/;
  var hasMeta    = !UNSET.test(CFG.metaPixelId) && /^\d{10,20}$/.test(CFG.metaPixelId);
  var hasGTM     = !UNSET.test(CFG.gtmId)  && /^GTM-[A-Z0-9]{4,}$/i.test(CFG.gtmId);
  var hasGA      = !UNSET.test(CFG.ga4Id)  && /^G-[A-Z0-9]{6,}$/i.test(CFG.ga4Id);

  /* Nothing configured yet — leave the page completely alone. */
  if (!hasMeta && !hasGTM && !hasGA) {
    window.erjTrack = function () {};
    window.ERJ_TRACK_READY = false;
    return;
  }

  /* Do Not Track / Global Privacy Control */
  if (CFG.respectDoNotTrack) {
    var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
              navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true;
    if (dnt) {
      window.erjTrack = function () {};
      window.ERJ_TRACK_READY = false;
      return;
    }
  }

  function log() {
    if (!CFG.debug || !window.console) return;
    try { console.log.apply(console, ['[erj-track]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════
     DEFERRED LOADING
     The vendor scripts (fbevents.js ~110KB, gtm.js ~150KB) are large
     and execute a lot of JavaScript. Loading them in the critical path
     cost roughly 450ms of Total Blocking Time on a mid-tier phone.

     Nothing is lost by waiting: the fbq() stub and window.dataLayer are
     created IMMEDIATELY below, so every event fired before the vendor
     script arrives is queued and flushed the moment it loads. Only the
     network fetch and the parse are deferred.

     Whichever of these happens first wins: the browser going idle, the
     first real user interaction, or a hard timeout after load.
     ═══════════════════════════════════════════════════════════ */
  var _deferred = [], _fired = false;
  function onIdle(fn){ _deferred.push(fn); }
  function flushDeferred(){
    if (_fired) return; _fired = true;
    for (var i = 0; i < _deferred.length; i++) {
      try { _deferred[i](); } catch (e) { log('deferred failed', e); }
    }
    _deferred.length = 0;
  }
  (function scheduleFlush(){
    var EVENTS = ['pointerdown','keydown','touchstart','wheel','scroll'];
    function go(){ EVENTS.forEach(function(e){ window.removeEventListener(e, go, true); }); flushDeferred(); }
    EVENTS.forEach(function(e){ window.addEventListener(e, go, {once:true, passive:true, capture:true}); });
    if (typeof window.requestIdleCallback === 'function') { window.requestIdleCallback(go, {timeout:3000}); }
    else { setTimeout(go, 2200); }
    if (document.readyState === 'complete') setTimeout(go, 800);
    else window.addEventListener('load', function(){ setTimeout(go, 800); }, {once:true});
  })();

  /* ═══════════════════════════════════════════════════════════
     META PIXEL
     ═══════════════════════════════════════════════════════════ */
  if (hasMeta) {
    /* stub + queue now, so nothing is missed */
    (function (f) {
      if (f.fbq) return;
      var n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    })(window);
    /* fetch the heavy vendor script once the page is out of the way */
    onIdle(function () {
      var t = document.createElement('script');
      t.async = true; t.src = 'https://connect.facebook.net/en_US/fbevents.js';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(t, s);
    });

    window.fbq('init', CFG.metaPixelId);
    window.fbq('track', 'PageView');
    log('Meta Pixel initialised', CFG.metaPixelId);
  }

  /* ═══════════════════════════════════════════════════════════
     GOOGLE TAG MANAGER
     Google's own loader, split in two: the dataLayer is seeded now
     so nothing is lost, and the 150KB gtm.js fetch waits for idle.
     ═══════════════════════════════════════════════════════════ */
  window.dataLayer = window.dataLayer || [];

  if (hasGTM) {
    /* seed the dataLayer immediately so pushes before load are preserved */
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    onIdle(function () {
      var j = document.createElement('script');
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + CFG.gtmId;
      var f = document.getElementsByTagName('script')[0];
      f.parentNode.insertBefore(j, f);
    });
    log('GTM queued', CFG.gtmId);
  }

  /* ═══════════════════════════════════════════════════════════
     GOOGLE ANALYTICS 4 — only if a direct ID was supplied.
     Normally GA4 lives inside GTM and this block stays off.
     ═══════════════════════════════════════════════════════════ */
  if (hasGA) {
    onIdle(function () {
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4Id);
      document.head.appendChild(g);
    });

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.ga4Id, { send_page_view: true });
    log('GA4 initialised', CFG.ga4Id);
  }

  /* ═══════════════════════════════════════════════════════════
     SEND — one call reaches both platforms
     ═══════════════════════════════════════════════════════════ */
  var GA_NAME = {
    ViewContent:      'view_item',
    Lead:             'generate_lead',
    InitiateCheckout: 'begin_checkout',
    Purchase:         'purchase',
    Contact:          'contact',
    DiagnosisComplete: 'diagnosis_complete',
    AuditStarted: 'audit_started',
    DiagnosticReportDownloaded: 'diagnostic_report_downloaded',
    ProductRecommendationClick: 'product_recommendation_click',
    MasterclassRegistrationStarted: 'masterclass_registration_started',
    ClinicReminderOptIn: 'clinic_reminder_opt_in',
    CohortFitStarted: 'cohort_fit_started',
    CohortCheckoutStarted: 'cohort_checkout_started'
  };

  function send(event, params) {
    params = params || {};
    log(event, params);

    if (hasMeta && window.fbq) {
      try { window.fbq('track', event, params); } catch (e) { log('meta failed', e); }
    }

    if (hasGA && window.gtag) {
      var name = GA_NAME[event] || event.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
      var ga = {
        currency: params.currency || CURRENCY,
        value:    params.value || 0,
        items:    params.content_name ? [{
          item_id:   params.content_ids ? params.content_ids[0] : undefined,
          item_name: params.content_name,
          price:     params.value || 0,
          quantity:  1
        }] : undefined
      };
      if (params.method)      ga.method = params.method;
      if (params.link_url)    ga.link_url = params.link_url;
      try { window.gtag('event', name, ga); } catch (e) { log('ga failed', e); }
    }

    /* GTM: push a clean, named event so you can build triggers on
       it inside Tag Manager without touching this file again.
       Trigger on Custom Event = erj_lead / erj_begin_checkout /
       erj_view_item / erj_purchase / erj_contact.                */
    if (hasGTM) {
      try {
        window.dataLayer.push({
          event:         'erj_' + (GA_NAME[event] || event.toLowerCase()),
          erj_event:     event,
          erj_name:      params.content_name || '',
          erj_value:     params.value || 0,
          erj_currency:  params.currency || CURRENCY,
          erj_method:    params.method || '',
          erj_link:      params.link_url || ''
        });
      } catch (e) { log('gtm push failed', e); }
    }
  }

  /* a manual erjTrack() call means something happened — load now. */
  window.erjTrack = function (e, prm) { flushDeferred(); return send(e, prm); };
  window.ERJ_TRACK_READY = true;

  /* ═══════════════════════════════════════════════════════════
     AUTOMATIC EVENTS
     ═══════════════════════════════════════════════════════════ */

  /* ── ViewContent on product pages ────────────────────────── */
  (function () {
    var path = (location.pathname || '').replace(/index\.html$/, '');
    if (!/\/$/.test(path) && !/\.html$/.test(path)) path += '/';
    for (var i = 0; i < PRODUCT_PAGES.length; i++) {
      var p = PRODUCT_PAGES[i];
      if (path.indexOf(p.match) !== -1 || location.pathname.indexOf(p.match) !== -1) {
        send('ViewContent', {
          content_name: p.name,
          content_type: 'product',
          value: p.value,
          currency: CURRENCY
        });
        break;
      }
    }
  })();

  /* ── Click delegation: WhatsApp = Lead, checkout = InitiateCheckout.
        Delegated on document so it also catches links that
        erj-capture.js injects after load. ────────────────────── */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    var href = a.getAttribute('href') || '';
    if (!href) return;

    /* WhatsApp — a real enquiry, the site's main conversion */
    if (/(^|\/\/)(wa\.me|api\.whatsapp\.com)/.test(href) || href.indexOf('wa.me/') !== -1) {
      send('Lead', {
        content_name: (a.textContent || 'WhatsApp').trim().slice(0, 90),
        method: 'whatsapp',
        link_url: href,
        value: 0,
        currency: CURRENCY
      });
      var decoded = '';
      try { decoded = decodeURIComponent(href.replace(/\+/g, ' ')); } catch (_e) { decoded = href; }
      if (/\bCOHORT FIT\b/i.test(decoded)) {
        send('CohortFitStarted', { content_name: 'Cohort 10 fit check', method: 'whatsapp', link_url: href, value: 0, currency: CURRENCY });
      } else if (/\bAUDIT\b/i.test(decoded)) {
        send('AuditStarted', { content_name: 'Job Search AUDIT', method: 'whatsapp', link_url: href, value: 0, currency: CURRENCY });
      } else if (/\bCLINIC\b/i.test(decoded)) {
        send('ClinicReminderOptIn', { content_name: 'Application Clinic WhatsApp reminder', method: 'whatsapp', link_url: href, value: 0, currency: CURRENCY });
      }
      return;
    }

    /* The free broadcast channel — softer signal, tracked separately */
    if (href.indexOf('whatsapp.com/channel') !== -1) {
      send('Contact', {
        content_name: 'Free WhatsApp job channel',
        method: 'whatsapp_channel',
        link_url: href,
        value: 0,
        currency: CURRENCY
      });
      return;
    }

    /* Checkout — Selar or Paystack */
    for (var key in CHECKOUTS) {
      if (!Object.prototype.hasOwnProperty.call(CHECKOUTS, key)) continue;
      if (href.indexOf(key) !== -1) {
        var c = CHECKOUTS[key];
        send('InitiateCheckout', {
          content_name: c.name,
          content_ids: [key],
          content_type: 'product',
          num_items: 1,
          value: c.value,
          currency: CURRENCY,
          link_url: href
        });
        if (c.name.indexOf('Foundation Training') !== -1) {
          send('CohortCheckoutStarted', {
            content_name: 'Cohort 10 - ' + c.name,
            content_ids: [key],
            value: c.value,
            currency: CURRENCY,
            link_url: href
          });
        }
        return;
      }
    }

    /* A checkout link we have no price for — still worth knowing */
    if (href.indexOf('selar.com') !== -1 || href.indexOf('paystack.') !== -1) {
      send('InitiateCheckout', {
        content_name: 'Unmapped checkout link',
        value: 0,
        currency: CURRENCY,
        link_url: href
      });
    }
  }, true);

})();
