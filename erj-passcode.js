/* ═══════════════════════════════════════════════════════════════════
   ERJ COHORT PASSCODES  ·  single source of truth
   ═══════════════════════════════════════════════════════════════════

   FORMAT      ERJM-<TIER>-<YYYY><HH>

     TIER      CORE  = Stages 1–4  (Complete Remote Career Programme)
               FULL  = Stages 1–5  (Get Your Dream Job Offer)

     YYYY      Gregorian year in which the cohort BEGINS
     HH        Two-letter Hebrew month abbreviation for the Hebrew month
               in which the cohort BEGINS

   EXAMPLES    ERJM-FULL-2026AV   cohort of 3–30 August 2026      (Av)
               ERJM-CORE-2026AV   same cohort, Stages 1–4 only
               ERJM-FULL-2026EL   cohort of 31 Aug – 26 Sept 2026 (Elul)

   THERE IS A SECOND FORMAT   ERJCV-<YYMM>-<SSSSSS><CC>
   The standalone ₦5,000 CV Engine pass: thirty days from first use, and
   nothing else — no stages, no portal. YYMM is a hard backstop month
   baked into the code; SSSSSS is a cryptographically random serial;
   CC is a typo check. Full explanation sits above cvValidate() below.

   THE RULE FOR ADDING A COHORT
   Take the date the cohort begins, find the Hebrew month that date falls
   in, use its abbreviation, and pair it with the Gregorian year of that
   same start date. Then add a row to COHORTS below. Nothing else needs
   editing — the dashboard and the admin panel both read this file.

   IMPORTANT — WHAT THIS IS AND IS NOT
   These codes run in the browser, so anyone who opens developer tools can
   read them. They are a convenience gate and an attribution trail, not
   security. They stop a casual visitor wandering into paid stages and they
   record who redeemed what. They do NOT stop a determined person, and they
   should not be relied on as if they did. If real access control is ever
   needed, validation has to move to a server.
═══════════════════════════════════════════════════════════════════ */

(function (root) {
  'use strict';

  /* Hebrew months, ecclesiastical order, with the abbreviations used in codes */
  var HEBREW_MONTHS = {
    NI: 'Nisan',   IY: 'Iyar',     SI: 'Sivan',    TA: 'Tammuz',
    AV: 'Av',      EL: 'Elul',     TI: 'Tishrei',  CH: 'Cheshvan',
    KI: 'Kislev',  TE: 'Tevet',    SH: 'Shevat',   AD: 'Adar',
    A2: 'Adar II'
  };

  /* ── COHORTS ──────────────────────────────────────────────────────
     starts / ends are inclusive, ISO, and describe the COHORT window
     (not the enrolment window). `confirmed:false` rows are projected
     forward for convenience — check the Hebrew month before announcing
     one of them, then flip the flag.
  ─────────────────────────────────────────────────────────────────── */
  var COHORTS = [
    { n: 9,  starts: '2026-08-03', ends: '2026-08-30', year: 2026, hm: 'AV', confirmed: true  },
    { n: 10, starts: '2026-08-31', ends: '2026-09-26', year: 2026, hm: 'EL', confirmed: true  },
    { n: 11, starts: '2026-09-27', ends: '2026-10-24', year: 2026, hm: 'TI', confirmed: false },
    { n: 12, starts: '2026-10-25', ends: '2026-11-21', year: 2026, hm: 'CH', confirmed: false },
    { n: 13, starts: '2026-11-22', ends: '2026-12-19', year: 2026, hm: 'KI', confirmed: false },
    { n: 14, starts: '2026-12-20', ends: '2027-01-16', year: 2026, hm: 'TE', confirmed: false }
  ];

  var TIERS = {
    CORE: { label: 'Stages 1–4 · Complete Remote Career Programme',
            stages: ['stage1', 'stage2', 'stage3', 'stage4'] },
    FULL: { label: 'Stages 1–5 · Get Your Dream Job Offer',
            stages: ['stage1', 'stage2', 'stage3', 'stage4', 'stage5'] }
  };

  /* ── LEGACY CODES ─────────────────────────────────────────────────
     Codes already issued to earlier cohorts. They must keep working —
     a participant holding one of these paid for it. Do not remove.
  ─────────────────────────────────────────────────────────────────── */
  var LEGACY = {
    'ERJM-FULL-2026': 'FULL',
    'ERJM-S4-2026':   'CORE',
    'ERJM-S3-2026':   null,   /* partial — handled below */
    'ERJM-S2-2026':   null,
    'ERJM-S1-2026':   null,
    'ERJ-ALL-ACCESS': 'FULL',
    'COHORT7-FULL':   'FULL'
  };
  var LEGACY_PARTIAL = {
    'ERJM-S1-2026': ['stage1'],
    'ERJM-S2-2026': ['stage1', 'stage2'],
    'ERJM-S3-2026': ['stage1', 'stage2', 'stage3']
  };

  function suffix(c) { return String(c.year) + c.hm; }

  function codeFor(cohort, tier) {
    return 'ERJM-' + tier + '-' + suffix(cohort);
  }

  /* Normalise anything a human might type or paste: case, spaces,
     smart dashes, missing dashes. */
  function normalise(raw) {
    return String(raw || '')
      .toUpperCase()
      .replace(/[\u2010-\u2015\u2212]/g, '-')   /* en/em dashes → hyphen */
      .replace(/\s+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function cohortByNumber(n) {
    for (var i = 0; i < COHORTS.length; i++) if (COHORTS[i].n === n) return COHORTS[i];
    return null;
  }

  /* The cohort whose window contains `date` (default: today).
     If today falls between cohorts, returns the next one starting. */
  function currentCohort(date) {
    var d = (date ? new Date(date) : new Date());
    var iso = d.toISOString().slice(0, 10);
    var i;
    for (i = 0; i < COHORTS.length; i++) {
      if (iso >= COHORTS[i].starts && iso <= COHORTS[i].ends) return COHORTS[i];
    }
    for (i = 0; i < COHORTS.length; i++) {
      if (iso < COHORTS[i].starts) return COHORTS[i];
    }
    return COHORTS[COHORTS.length - 1];
  }

  /* ═════════════════════════════════════════════════════════════════
     CV ENGINE PASS  ·  ERJCV-<YYMM>-<SSSSSS><CC>
     ═════════════════════════════════════════════════════════════════
     A standalone ₦5,000 product: thirty days of access to the CV Engine
     for someone who is not in a cohort and does not want the training.

     THE THIRTY DAYS RUN FROM FIRST USE, NOT FROM PURCHASE. Someone who
     buys on a Friday and does not open it until the following Thursday
     still gets their full month. The activation date is stamped in the
     browser the first time the code is accepted.

     WHY THE CODE ALSO CARRIES ITS OWN EXPIRY MONTH
     That activation stamp lives in localStorage, and localStorage can be
     cleared — which would hand back a fresh thirty days. So every code
     also carries a backstop month (YYMM) baked into it at the moment it
     is issued. Past the last day of that month the code is dead however
     many times storage is wiped. Issue codes with a backstop roughly
     three months out and the thirty-day window is the binding limit for
     every honest buyer, while a determined one gets months, not years.

     WHY THERE IS AN ISSUED LIST — AND WHAT IT DOES NOT DO
     This runs in the browser, so anyone who opens developer tools can read
     the format and mint a code that passes the checksum. The ISSUED list
     closes that: with anything in it, only codes on it are accepted.

     Be clear about the limit. This file is served to every visitor, so a
     person who views source can also READ the list and try an unsold code.
     What you have is a finite, revocable set of keys — not a vault. Delete
     a line to kill that code instantly, and do it the moment you suspect
     one. If this ever needs to be real, validation moves to a server.

     ALPHABET  No I, O, 0 or 1 — those are the characters people get wrong
     when they retype a code from a WhatsApp message.
  ═════════════════════════════════════════════════════════════════ */
  var CV_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var CV_DAYS = 30;

  /* ── ISSUED CV PASSES ─────────────────────────────────────────────
     Paste generated codes here, one per line, then deploy. An empty
     list means checksum-only validation, which is far weaker — the
     admin panel warns about it.
     Remove a code to kill it immediately, even mid-month.
  ─────────────────────────────────────────────────────────────────── */
  var CV_ISSUED = [
    'ERJCV-2611-3NXBSYJC',
    'ERJCV-2611-GH3864BG',
    'ERJCV-2611-RQF956SQ',
    'ERJCV-2611-896UFXRZ',
    'ERJCV-2611-F7NXZ5V2',
    'ERJCV-2611-HMPACH2K',
    'ERJCV-2611-J6B4LL5H',
    'ERJCV-2611-YBEJHZ76',
    'ERJCV-2611-SD32JV3U',
    'ERJCV-2611-269CCW9R',
    'ERJCV-2611-UYSKHH3W',
    'ERJCV-2611-XJA8L8UT',
    'ERJCV-2611-M3F7273Q',
    'ERJCV-2611-ESCM4RVX',
    'ERJCV-2611-57KVSG83',
    'ERJCV-2611-6ZCDR9K7',
    'ERJCV-2611-HBZATS7D',
    'ERJCV-2611-TCQ2H76T',
    'ERJCV-2611-PLHGULRC',
    'ERJCV-2611-9R5QTJJM',
    'ERJCV-2611-BBFBQU7F',
    'ERJCV-2611-E6R9Y3R9',
    'ERJCV-2611-9NZ8D28L',
    'ERJCV-2611-DSVS5QF8',
    'ERJCV-2611-ZX36A4TV',
  ];

  /* Deterministic two-character check over the code body. Not security —
     it only stops a typo or an idle guess from being accepted. */
  function cvCheck(body) {
    var h = 7;
    for (var i = 0; i < body.length; i++) {
      h = (h * 31 + body.charCodeAt(i)) % 1024;
    }
    return CV_ALPHABET.charAt(h % 32) + CV_ALPHABET.charAt(Math.floor(h / 32) % 32);
  }

  /* Last calendar day of the YYMM a code carries, as ISO. */
  function cvBackstop(yymm) {
    var y = 2000 + parseInt(yymm.slice(0, 2), 10);
    var m = parseInt(yymm.slice(2), 10);
    if (!(m >= 1 && m <= 12)) return null;
    var d = new Date(Date.UTC(y, m, 0));            /* day 0 of next month = last of this */
    return d.toISOString().slice(0, 10);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* Mint a code. `monthsAhead` sets how far out the backstop sits —
     three months is the sensible default: long enough that nobody's
     thirty days is ever cut short, short enough that a code found in a
     screenshot next year is worthless. */
  /* ── WHERE THE RANDOMNESS COMES FROM ──────────────────────────────
     crypto.getRandomValues, not Math.random. Math.random is a plain
     pseudo-random generator: see enough of its output and the next
     value is predictable, which is exactly the wrong property for a
     thing people pay for.

     The rejection loop matters too. The alphabet has 32 characters and
     a byte holds 256 values, so 256 divides evenly by 32 and there is
     no bias here — but the loop is kept anyway so that changing the
     alphabet length later cannot silently make some characters more
     likely than others.

     NOTHING IN A CODE IS DERIVED FROM THE BUYER. Not their name, their
     email, their phone number, the order they bought in, or the time
     they paid. Two codes issued a second apart share nothing but the
     backstop month. Knowing one code tells you nothing about the next.
  ─────────────────────────────────────────────────────────────────── */
  var CV_SERIAL_LEN = 6;                 /* 32^6 = 1,073,741,824 serials */

  function cvRandomChars(n) {
    var out = '';
    var g = (typeof crypto !== 'undefined' && crypto.getRandomValues)
              ? crypto : null;
    if (!g) {
      /* No Web Crypto — refuse rather than quietly issue weak codes. */
      throw new Error('This browser has no crypto.getRandomValues, so codes ' +
                      'cannot be generated securely here. Use a current ' +
                      'Chrome, Safari, Firefox or Edge.');
    }
    var buf = new Uint8Array(n * 2);
    while (out.length < n) {
      g.getRandomValues(buf);
      for (var i = 0; i < buf.length && out.length < n; i++) {
        var v = buf[i];
        if (v >= 256 - (256 % CV_ALPHABET.length)) continue;   /* reject bias */
        out += CV_ALPHABET.charAt(v % CV_ALPHABET.length);
      }
    }
    return out;
  }

  function cvIssue(monthsAhead) {
    var now = new Date();
    var b = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + (monthsAhead || 3), 1));
    var yymm = String(b.getUTCFullYear()).slice(2) +
               ('0' + (b.getUTCMonth() + 1)).slice(-2);
    var body = 'ERJCV-' + yymm + '-' + cvRandomChars(CV_SERIAL_LEN);
    return body + cvCheck(body);
  }

  /* A batch, all distinct, ready to paste into CV_ISSUED and to sell. */
  function cvIssueBatch(n, monthsAhead) {
    var out = [], seen = {};
    var guard = 0;
    while (out.length < (n || 25) && guard++ < 5000) {
      var c = cvIssue(monthsAhead);
      if (!seen[c]) { seen[c] = 1; out.push(c); }
    }
    return out;
  }

  /* The stored activation record, if there is one. */
  var CV_LS = 'erj_cvpass_v1';
  function cvRecord() {
    try { return JSON.parse(localStorage.getItem(CV_LS) || 'null'); } catch (e) { return null; }
  }
  function cvActivate(code) {
    var r = cvRecord();
    if (r && r.code === code && r.activated) return r;      /* already running — do not restart */
    r = { code: code, activated: today() };
    try { localStorage.setItem(CV_LS, JSON.stringify(r)); } catch (e) {}
    return r;
  }

  function cvValidate(code) {
    /* Accept it with the hyphens missing or spaced, which is what happens
       when it is retyped from a screenshot. normalise() has already
       upper-cased and squeezed the whitespace. */
    var m = code.match(/^ERJCV-(\d{4})-([23456789A-HJ-NP-Z]{8})$/) ||
            code.replace(/[^A-Z0-9]/g, '')
                .match(/^ERJCV(\d{4})([23456789A-HJ-NP-Z]{8})$/);
    if (!m) return null;                                    /* not a CV pass at all */
    var yymm = m[1], rest = m[2];
    code = 'ERJCV-' + yymm + '-' + rest;                    /* canonical form */
    var body = 'ERJCV-' + yymm + '-' + rest.slice(0, CV_SERIAL_LEN);
    if (cvCheck(body) !== rest.slice(CV_SERIAL_LEN)) {
      return { ok: false, reason: 'cv-bad-check' };
    }
    var backstop = cvBackstop(yymm);
    if (!backstop) return { ok: false, reason: 'cv-bad-month' };
    if (CV_ISSUED.length && CV_ISSUED.indexOf(code) === -1) {
      return { ok: false, reason: 'cv-not-issued' };
    }
    var t = today();
    if (t > backstop) {
      return { ok: false, reason: 'cv-dead', backstop: backstop };
    }
    var rec = cvActivate(code);
    var ends = addDays(rec.activated, CV_DAYS - 1);
    if (ends > backstop) ends = backstop;                   /* the backstop always wins */
    var left = Math.round(
      (new Date(ends + 'T00:00:00Z') - new Date(t + 'T00:00:00Z')) / 86400000
    ) + 1;
    if (t > ends) {
      return { ok: false, reason: 'cv-expired', activated: rec.activated, ends: ends };
    }
    return {
      ok: true, code: code, tier: 'CVPASS',
      stages: [],                                           /* buys the tool, not the training */
      cvEngine: true,
      label: 'CV Engine pass · ' + left + ' day' + (left === 1 ? '' : 's') + ' left',
      cohort: null, legacy: false, expired: false,
      activated: rec.activated, ends: ends, daysLeft: left, backstop: backstop
    };
  }

  /* Validate a typed code.
     → { ok:true, tier, stages, cohort, code, legacy, expired }
     → { ok:false, reason } */
  function validate(raw) {
    var code = normalise(raw);
    if (!code) return { ok: false, reason: 'empty' };

    /* CV Engine passes are checked first — they are their own format and
       must never fall through to the cohort matcher. */
    var cv = cvValidate(code);
    if (cv) return cv;

    /* current-format codes. Also accept the code with the hyphens missing
       or replaced by spaces, which is what happens when it is pasted out of
       a WhatsApp message or retyped from a screenshot. */
    var m = code.match(/^ERJM-(CORE|FULL)-(\d{4})([A-Z0-9]{2})$/) ||
            code.replace(/[^A-Z0-9]/g, '')
                .match(/^ERJM(CORE|FULL)(\d{4})([A-Z0-9]{2})$/);
    if (m) {
      var tier = m[1], year = parseInt(m[2], 10), hm = m[3];
      for (var i = 0; i < COHORTS.length; i++) {
        var c = COHORTS[i];
        if (c.year === year && c.hm === hm) {
          /* Named `iso`, not `today` — there is a today() helper at module
             level and a `var today` here would shadow it for this whole
             function, so the next person to call today() inside validate()
             would get "today is not a function". */
          var iso = today();
          return {
            ok: true, code: code, tier: tier,
            stages: TIERS[tier].stages.slice(),
            label: TIERS[tier].label,
            cohort: c, legacy: false,
            expired: iso > c.ends
          };
        }
      }
      if (HEBREW_MONTHS[hm]) return { ok: false, reason: 'unknown-cohort' };
      return { ok: false, reason: 'bad-month' };
    }

    /* legacy codes — still honoured */
    if (Object.prototype.hasOwnProperty.call(LEGACY, code)) {
      if (LEGACY_PARTIAL[code]) {
        return { ok: true, code: code, tier: 'LEGACY',
                 stages: LEGACY_PARTIAL[code].slice(),
                 label: 'Legacy code · ' + LEGACY_PARTIAL[code].length + ' stage(s)',
                 cohort: null, legacy: true, expired: false };
      }
      var t = LEGACY[code];
      return { ok: true, code: code, tier: t, stages: TIERS[t].stages.slice(),
               label: 'Legacy code · ' + TIERS[t].label,
               cohort: null, legacy: true, expired: false };
    }

    return { ok: false, reason: 'invalid' };
  }

  root.ERJPasscode = {
    HEBREW_MONTHS: HEBREW_MONTHS,
    COHORTS: COHORTS,
    TIERS: TIERS,
    normalise: normalise,
    suffix: suffix,
    codeFor: codeFor,
    currentCohort: currentCohort,
    cohortByNumber: cohortByNumber,
    validate: validate,
    /* CV Engine pass (₦5,000 · 30 days from first use) */
    CV_DAYS: CV_DAYS,
    CV_ISSUED: CV_ISSUED,
    CV_SERIAL_LEN: CV_SERIAL_LEN,
    cvIssue: cvIssue,
    cvIssueBatch: cvIssueBatch,
    cvRecord: cvRecord,
    cvCheck: cvCheck,
    cvBackstop: cvBackstop,
    /* Wipe the local activation stamp — for support, when someone has to
       be moved to a new device and you have decided to allow it. */
    cvReset: function () { try { localStorage.removeItem(CV_LS); } catch (e) {} },
    /* Both codes for a cohort, ready to display or send. */
    codesFor: function (cohort) {
      var c = (typeof cohort === 'number') ? cohortByNumber(cohort) : (cohort || currentCohort());
      if (!c) return null;
      return {
        cohort: c,
        core: codeFor(c, 'CORE'),
        full: codeFor(c, 'FULL'),
        month: HEBREW_MONTHS[c.hm] || c.hm,
        window: c.starts + ' \u2192 ' + c.ends
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
