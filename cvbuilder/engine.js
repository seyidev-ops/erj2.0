/* ═══════════════════════════════════════════════════════════════════
   ERJ CV ENGINE
   ═══════════════════════════════════════════════════════════════════
   Everything runs in the browser. No network calls, no uploads, no
   storage beyond this device's localStorage. That is deliberate: people
   paste salary history and personal contact details into this thing.

   The scorer implements the SAME ten points as the public CV Self-Scan,
   so a document built here and then run through that tool agrees with
   itself. If the scan rubric ever changes, change CHECKS below to match.

   Honest limits, stated here and in the UI:
     - We score against the ERJ rubric. We cannot score against Workday,
       Greenhouse or Taleo, none of which publish their scoring.
     - The humaniser rewrites phrasing only. It never invents a metric,
       a tool or an achievement.
═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
var LS = 'erj_cv_engine_v1';
var LSGATE = 'erj_cv_gate_v1';

/* ─────────────────────────── GATE ─────────────────────────── */
function openApp() {
  $('gate').style.display = 'none';
  $('app').style.display = '';
  load();
  if (!jobsEl.children.length) addJob(true);   /* only seed a blank role if none were restored */
  render();
}
function fmtDay(iso) {
  if (!iso) return '';
  var M = ['January','February','March','April','May','June',
           'July','August','September','October','November','December'];
  var p = iso.split('-');
  return parseInt(p[2], 10) + ' ' + M[parseInt(p[1], 10) - 1] + ' ' + p[0];
}

/* A CV Engine pass is a rented month, so the person renting it should be
   able to see how much of it is left without having to work it out. */
function showPassBanner(r) {
  var el = $('passBar');
  if (!el) return;
  if (!r || r.tier !== 'CVPASS') { el.style.display = 'none'; return; }
  var urgent = r.daysLeft <= 5;
  el.style.display = '';
  el.className = 'passbar' + (urgent ? ' passbar-soon' : '');
  el.innerHTML = '<span><b>' + r.daysLeft + ' day' + (r.daysLeft === 1 ? '' : 's') +
    '</b> left on your CV Engine pass \u00b7 ends ' + fmtDay(r.ends) + '</span>' +
    (urgent
      ? '<a href="https://paystack.shop/pay/erj-cvpass" target="_blank" rel="noopener">Renew for \u20a65,000</a>'
      : '<a href="../register.html">See the full programme</a>');
}

function tryGate(code, quiet) {
  if (!window.ERJPasscode) {
    if (!quiet) msg('#F87171', 'Code checker did not load. Refresh and try again.');
    return false;
  }
  var r = window.ERJPasscode.validate(code);
  if (!r.ok) {
    /* An expired or dead CV pass is always explained, even on the silent
       auto-unlock attempt. Someone whose month has just run out deserves to
       be told that, not shown a login box with no reason given. */
    var loud = !quiet ||
               r.reason === 'cv-expired' || r.reason === 'cv-dead' || r.reason === 'cv-not-issued';
    if (loud) {
      if (r.reason === 'cv-expired') {
        msg('#F59E0B', 'That pass has finished its thirty days \u2014 it started on ' +
            fmtDay(r.activated) + ' and ended on ' + fmtDay(r.ends) +
            '. Buy another pass, or enrol for a stage and get a code that does not expire.');
        try { localStorage.removeItem(LSGATE); } catch (e) {}
      } else if (r.reason === 'cv-dead') {
        msg('#F59E0B', 'That pass is past its expiry date. Message us on WhatsApp and we will sort it out.');
        try { localStorage.removeItem(LSGATE); } catch (e) {}
      } else {
        msg('#F87171', ({
          'empty':          'Enter your access code.',
          'bad-month':      'The last two letters are not a month we recognise.',
          'unknown-cohort': 'That code is not for a cohort we run. Check it against your receipt.',
          'cv-bad-check':   'That pass code is not quite right \u2014 check it character by character.',
          'cv-bad-month':   'That pass code is not quite right \u2014 check it character by character.',
          'cv-not-issued':  'That pass has not been issued. Send us your payment receipt on WhatsApp and we will send your code.'
        }[r.reason]) || 'That code is not valid. Check it, or message us on WhatsApp.');
      }
    }
    return false;
  }
  try { localStorage.setItem(LSGATE, r.code); } catch (e) {}
  showPassBanner(r);
  openApp();
  return true;
}
function msg(c, t) { var m = $('gateMsg'); m.style.color = c; m.textContent = t; }

$('gateGo').addEventListener('click', function () { tryGate($('gateIn').value); });
$('gateIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryGate($('gateIn').value); });
/* NB: the auto-unlock attempt lives at the very BOTTOM of this file.
   Running it here would call load() before FIELDS and jobsEl are
   initialised, which throws and kills every listener below. */

/* ─────────────────────────── STATE ─────────────────────────── */
var jobsEl = $('jobs');
var FIELDS = ['fName','fTitle','fEmail','fPhone','fCity','fTz','fLinkedin','fPortfolio',
              'fSummary','fSkills','fTools','fEdu','fJd','fJdCo','fJdRole'];
var jdPicked = [];
var tpl = 'intl';   /* chosen ATS template — see docx.js */

function addJob(silent, data) {
  var i = jobsEl.children.length;
  var d = data || {};
  var w = document.createElement('div');
  w.className = 'roleblk';
  w.innerHTML =
    '<div class="roleblk-top"><span class="roleblk-n">Role ' + (i + 1) + '</span>' +
    '<button class="xbtn" title="Remove">\u2715</button></div>' +
    '<div class="row2">' +
      '<div><label>Job title</label><input type="text" class="j-title" value="' + esc(d.title) + '" placeholder="Customer Support Officer"></div>' +
      '<div><label>Employer</label><input type="text" class="j-co" value="' + esc(d.co) + '" placeholder="Paystack"></div>' +
    '</div>' +
    '<div class="row2">' +
      '<div><label>Dates</label><input type="text" class="j-dates" value="' + esc(d.dates) + '" placeholder="Jan 2023 – Mar 2025"></div>' +
      '<div><label>Location / remote</label><input type="text" class="j-loc" value="' + esc(d.loc) + '" placeholder="Lagos, Nigeria · Hybrid"></div>' +
    '</div>' +
    '<label>Achievements — one per line, each with a number</label>' +
    '<textarea class="j-bul" rows="5" placeholder="Handled about 60 tickets a day across email and live chat&#10;Cut average first response from 8 hours to under 2&#10;Documented the top 5 issues into a help centre, removing about 30% of repeat tickets">' + esc(d.bul) + '</textarea>';
  w.querySelector('.xbtn').addEventListener('click', function () {
    w.remove(); renumber(); render(); save();
  });
  w.querySelectorAll('input,textarea').forEach(function (el) {
    el.addEventListener('input', function () { render(); save(); });
  });
  jobsEl.appendChild(w);
  if (!silent) { render(); save(); }
}
function renumber() {
  [].forEach.call(jobsEl.children, function (c, i) {
    c.querySelector('.roleblk-n').textContent = 'Role ' + (i + 1);
  });
}
function esc(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function val(id) { var e = $(id); return e ? e.value.trim() : ''; }

function readJobs() {
  return [].map.call(jobsEl.children, function (c) {
    return {
      title: c.querySelector('.j-title').value.trim(),
      co:    c.querySelector('.j-co').value.trim(),
      dates: c.querySelector('.j-dates').value.trim(),
      loc:   c.querySelector('.j-loc').value.trim(),
      bul:   c.querySelector('.j-bul').value.trim()
    };
  }).filter(function (j) { return j.title || j.co || j.bul; });
}

function snapshot() {
  var o = { jobs: readJobs(), jd: jdPicked, tpl: tpl };
  FIELDS.forEach(function (f) { o[f] = val(f); });
  return o;
}
function save() { try { localStorage.setItem(LS, JSON.stringify(snapshot())); } catch (e) {} }
function load() {
  var raw; try { raw = localStorage.getItem(LS); } catch (e) { return; }
  if (!raw) return;
  var o; try { o = JSON.parse(raw); } catch (e) { return; }
  FIELDS.forEach(function (f) { if ($(f) && o[f]) $(f).value = o[f]; });
  jdPicked = o.jd || [];
  if (o.tpl && window.ERJDocx && window.ERJDocx.TEMPLATES[o.tpl]) tpl = o.tpl;
  jobsEl.innerHTML = '';
  (o.jobs || []).forEach(function (j) { addJob(true, j); });
}

/* ─────────────────────── THE TEN CHECKS ───────────────────────
   Same rubric as the public CV Self-Scan. Each returns:
     st  'pass' | 'part' | 'fail'
     why what to do about it, in one sentence
─────────────────────────────────────────────────────────────── */
var TOOL_WORDS = ['slack','zoom','notion','asana','jira','trello','clickup','teams','meet',
  'google workspace','loom','confluence','monday','basecamp','zendesk','intercom','hubspot',
  'salesforce','figma','github','gitlab','miro','airtable','linear','freshdesk','helpscout'];
var ASYNC_WORDS = ['document','documented','documentation','wrote','written','brief','handover',
  'async','asynchronous','process','sop','playbook','knowledge base','help centre','help center',
  'runbook','status update','without supervision','autonomous','autonomously','self-managed',
  'distributed team','remote team','cross-border','cross-functional','time zone','timezone'];
var STRONG_VERBS = ['built','architected','streamlined','delivered','spearheaded','led','launched',
  'reduced','increased','cut','grew','designed','implemented','automated','negotiated','resolved',
  'handled','managed','created','developed','trained','improved','rebuilt','introduced','shipped',
  'coordinated','owned','drove','established','scaled','recovered','migrated','documented'];
var WEAK_OPENERS = ['responsible for','duties included','tasked with','worked on','helped with',
  'assisted with','in charge of','involved in','participated in'];

function bullets(d) {
  var out = [];
  d.jobs.forEach(function (j) {
    j.bul.split('\n').forEach(function (b) { b = b.trim(); if (b) out.push(b); });
  });
  return out;
}
function allText(d) {
  /* Must mirror EXACTLY what render() puts in the document — no more and no
     less. Confirmed step-3 keywords used to be added here and pinned onto the
     skills line at render time, so the scored text and the visible form could
     disagree. They are now written straight into the real Tools / Competencies
     field the moment you confirm them, so reading the fields is enough. */
  return [d.fSummary, d.fSkills, d.fTools, d.fEdu, d.fTitle]
    .concat(d.jobs.map(function (j) { return [j.title, j.co, j.loc, j.bul].join(' '); }))
    .join(' \n ').toLowerCase();
}

var CHECKS = [
  { id: 1, t: 'Clear timezone & location', run: function (d) {
      var hasCity = !!d.fCity, hasTz = /utc\s*[+\-]?\s*\d/i.test(d.fTz);
      if (hasCity && hasTz) return ok();
      if (hasCity || hasTz) return part('Add the missing half — you need <b>both</b> "Abuja, Nigeria" and "UTC+1" so an employer can work out overlap in one glance.');
      return bad('Add your city, country and UTC offset to the contact line. Remote employers screen for overlap before anything else.');
    }},
  { id: 2, t: 'Remote-ready summary', run: function (d) {
      var s = (d.fSummary || '').toLowerCase();
      if (s.length < 40) return bad('Write a three-to-four line summary. Without one, a recruiter has to assemble your value from bullets, and mostly will not.');
      var hits = ASYNC_WORDS.filter(function (w) { return s.indexOf(w) > -1; }).length;
      var seeking = /seeking|looking for an opportunity|opportunity to prove/.test(s);
      if (seeking) return part('Cut "seeking an opportunity" — it describes your need, not your value. Replace it with what you deliver.');
      if (hits >= 1) return ok();
      return part('Name your remote capability explicitly — working autonomously, distributed teams, or delivering across time zones.');
    }},
  { id: 3, t: 'Remote tool stack', run: function (d) {
      var t = (d.fTools || '').toLowerCase();
      var n = TOOL_WORDS.filter(function (w) { return t.indexOf(w) > -1; }).length;
      if (n >= 3) return ok();
      if (n >= 1) return part('Name at least three. One tool reads as incidental; three reads as someone who has actually worked this way.');
      return bad('Add a tools line — Slack, Zoom, Notion, Asana, Google Workspace. This is a scored point and it takes ten seconds.');
    }},
  { id: 4, t: 'ATS-safe formatting', run: function () {
      return ok('This engine only outputs a single-column layout with standard headings and no tables, graphics or text boxes — so this point is structurally guaranteed.');
    }},
  { id: 5, t: 'Quantifiable metrics', run: function (d) {
      var bs = bullets(d);
      if (!bs.length) return bad('Add your experience bullets in step 2.');
      var withNum = bs.filter(function (b) { return /\d/.test(b); }).length;
      var pct = withNum / bs.length;
      if (pct >= 0.6) return ok();
      if (pct >= 0.3) return part('Only ' + withNum + ' of ' + bs.length + ' bullets carry a number. Ask each one: <b>how many, and what changed?</b>');
      return bad(withNum + ' of ' + bs.length + ' bullets have a figure. Duties read the same as everyone else who held your job — numbers are what separate you.');
    }},
  { id: 6, t: 'Evidence of async work', run: function (d) {
      var txt = bullets(d).join(' ').toLowerCase() + ' ' + (d.fSummary || '').toLowerCase();
      var n = ASYNC_WORDS.filter(function (w) { return txt.indexOf(w) > -1; }).length;
      if (n >= 2) return ok();
      if (n === 1) return part('Add one more line showing you move work forward in writing — a process you documented, a handover, a status routine.');
      return bad('Nothing here shows you can work without live supervision. Add a bullet about something you documented or drove in writing.');
    }},
  { id: 7, t: 'Strong action verbs', run: function (d) {
      var bs = bullets(d);
      if (!bs.length) return bad('Add your experience bullets in step 2.');
      var weak = bs.filter(function (b) {
        var l = b.toLowerCase();
        return WEAK_OPENERS.some(function (w) { return l.indexOf(w) === 0; });
      }).length;
      var strong = bs.filter(function (b) {
        var first = b.toLowerCase().replace(/^[^a-z]+/, '').split(/\s+/)[0] || '';
        return STRONG_VERBS.indexOf(first) > -1;
      }).length;
      if (weak > 0) return bad(weak + ' bullet' + (weak > 1 ? 's start' : ' starts') + ' with a passive opener like "Responsible for". Step 4 will rewrite them.');
      if (strong / bs.length >= 0.6) return ok();
      return part('Open more bullets with a doing word — Built, Cut, Led, Documented, Resolved.');
    }},
  { id: 8, t: 'Keyword alignment', run: function (d) {
      if (!(d.fJd || '').trim()) return part('Paste the vacancy in step 3. Without a target, this point cannot be scored — and a generic CV is what most rejections are.');
      var need = extractJd(d.fJd, d.fJdCo);
      if (!need.length) return part('That job description produced no recognisable requirements. Check you pasted the full text.');
      var txt = allText(d);
      var got = need.filter(function (k) { return txt.indexOf(k.toLowerCase()) > -1; });
      var pct = got.length / need.length;
      if (pct >= 0.6) return ok(got.length + ' of ' + need.length + ' of their terms appear in your CV.');
      if (pct >= 0.3) return part('Only ' + got.length + ' of ' + need.length + ' of their terms appear. Step 3 shows exactly which are missing.');
      return bad('Just ' + got.length + ' of ' + need.length + ' of their terms appear. Mirror their wording for the things you genuinely have.');
    }},
  { id: 9, t: 'Professional links', run: function (d) {
      var li = !!d.fLinkedin, pf = !!d.fPortfolio;
      if (li && pf) return ok();
      if (li) return part('Add a portfolio or GitHub link. Proof beats claims, and it is a scored point.');
      if (pf) return part('Add your LinkedIn URL — recruiters check it, and a missing one reads as an incomplete candidate.');
      return bad('Add your LinkedIn and a portfolio link in step 2.');
    }},
  { id: 10, t: 'Universal file format', run: function () {
      return ok('Export with <b>Print / Save PDF</b> and your layout is locked on any device. Only send .doc when the employer asks for it.');
    }}
];
function ok(w)   { return { st: 'pass', why: w || 'Clear.' }; }
function part(w) { return { st: 'part', why: w }; }
function bad(w)  { return { st: 'fail', why: w }; }

/* ─────────────────────── JD EXTRACTION ─────────────────────── */
var JD_STOP = ('the and for with you your our are will have has that this from they their them a an of to in on at as be by or if it we us who what when '
  + 'able about across after all also am any because been being between both but can could did do does doing each else etc even ever every few first '
  + 'get give go good great had help here how into is its itself just keep know like look made make many may me more most much must my need new no not '
  + 'now off often once only other out over own per please really right same see should since so some such take than then there these thing think those '
  + 'through time too under up use used using very want was way well were which while who why work working works would year years role job candidate '
  + 'team teams company opportunity position responsibilities requirements experience skills strong excellent ability apply join looking ideal plus '
  + 'preferred required must-have nice benefits salary remote hybrid onsite full-time part-time contract '
  + 'emea apac amer latam anywhere worldwide global distributed hands comfortable familiar familiarity '
  + 'proficient proficiency knowledge understanding demonstrated exposure passion passionate eager keen '
  + 'join joining hiring hire seeking looking wanted apply application applicants candidates users customers '
  + 'client clients stakeholder stakeholders business product products service services support level senior '
  + 'junior mid lead manager management department organisation organization environment culture values '
  + 'plus bonus advantage desirable essential minimum maximum least well versed track record proven '
  + 'responsible responsibilities duty duties task tasks day days week weeks month months year years').split(/\s+/);

/* Terms that are real English but tell you nothing about a vacancy. These are
   the ones that survived JD_STOP and still turned up as chips. */
var JD_NOISE = ('ltd inc llc plc gmbh limited corp corporation company employer vacancy advert posting '
  + 'write writes writing report reports reporting partner partners partnering owner owning '
  + 'fluent english native speaker specialist generalist manager managing senior junior mid-level '
  + 'maintain maintaining drive driving deliver delivering support supporting queue queues '
  + 'first second third weekly monthly daily quarterly annual internal external').split(/\s+/);

function extractJd(txt, co) {
  if (!txt) return [];
  var low = ' ' + txt.toLowerCase() + ' ';
  var found = {};
  var company = String(co || '').toLowerCase().trim();
  var companyWords = company ? company.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean) : [];

  function reject(term) {
    if (!term || term.length < 4 || term.length > 34) return true;
    /* The employer's own name is not a skill. It used to arrive as a chip, and
       confirming it put "Acme Ltd" in the middle of someone's competencies. */
    if (company && term.indexOf(company) > -1) return true;
    if (companyWords.length && companyWords.indexOf(term) > -1) return true;
    if (JD_STOP.indexOf(term) > -1) return true;
    if (JD_NOISE.indexOf(term) > -1) return true;
    return false;
  }
  function count(t) { return low.split(t).length - 1; }

  /* 1 · named tools — the highest-signal terms in any advert */
  TOOL_WORDS.forEach(function (t) { if (low.indexOf(t) > -1 && !reject(t)) found[t] = 1; });

  /* 2 · phrases the advert actually repeats.
     The old version built two-word phrases AFTER deleting stopwords, which
     invented phrases nobody had written: "customer support specialist" lost
     the word "support" and came back as "customer specialist" — a phrase that
     appears in neither the advert nor any CV, so it could never be matched and
     served only to add noise and to pollute the competencies line when
     confirmed. Phrases are now built from the raw word stream and then checked
     back against the original text, so every chip is something the employer
     really wrote. */
  /* Segment on sentence and clause boundaries FIRST. Building the word stream
     across full stops produced phrases that span two sentences \u2014 "CSAT.
     Requirements:" came back as the chip "csat. requirements", which is not a
     skill and is not something any CV will ever contain. */
  var segs = low.split(/[.;:!?\n\u2022\|]+/);
  var raw = [], freq = {};
  segs.forEach(function (seg) {
    var w = seg.replace(/[^a-z0-9+#\- ]/g, ' ').split(/\s+/).filter(Boolean);
    raw = raw.concat(w);
    for (var i = 0; i < w.length - 1; i++) {
      var a = w[i], b = w[i + 1];
      if (a.length < 3 || b.length < 3) continue;
      if (JD_STOP.indexOf(a) > -1 || JD_STOP.indexOf(b) > -1) continue;
      var bi = a + ' ' + b;
      freq[bi] = (freq[bi] || 0) + 1;
    }
  });
  Object.keys(freq).forEach(function (k) {
    if (freq[k] >= 2 && low.indexOf(' ' + k + ' ') > -1 && !reject(k)) found[k] = 1;
  });

  /* 2b · single words the advert leans on. A two-word phrase must repeat to
     count, which is right, but it also means a vacancy that says
     "documentation" twice in two different phrasings contributes nothing.
     A word of five or more letters, used at least twice, and not on either
     stop list, is a term the employer is actually pressing on. */
  var wf = {};
  raw.forEach(function (w) {
    if (w.length < 5) return;
    if (JD_STOP.indexOf(w) > -1 || JD_NOISE.indexOf(w) > -1) return;
    wf[w] = (wf[w] || 0) + 1;
  });
  Object.keys(wf).forEach(function (w) { if (wf[w] >= 2 && !reject(w)) found[w] = 1; });

  /* 3 · proper nouns and acronyms — product, platform and domain terms.
     A capitalised word is only kept if it is a known tool, a short acronym, or
     it repeats. Otherwise every sentence that happens to start with "Write" or
     "Partner" donates a meaningless chip. */
  (txt.match(/\b[A-Z][A-Za-z0-9.+#]{2,}(?:\s[A-Z][A-Za-z0-9.+#]{2,})?/g) || []).forEach(function (w) {
    /* Trailing sentence punctuation used to survive, so "Operations Analyst."
       arrived as a second, duplicate chip beside "Operations Analyst". */
    /* Cut the match at any sentence boundary inside it, then strip trailing
       punctuation. Without this, "CSAT. Requirements:" was captured whole and
       arrived as the chip "csat. requirements" \u2014 two sentences pretending to
       be one skill. */
    var t = w.trim().replace(/[.,;:]+\s+[\s\S]*$/, '').replace(/[.,;:]+$/, ''),
        l = t.toLowerCase();
    if (reject(l)) return;
    if (/^(we|our|you|the|this|that|and|for|with|about|what|who|why|how|role|job)\b/.test(l)) return;
    if (/^[A-Z]{3,6}$/.test(t)) { found[l] = 1; return; }          /* CSAT, SQL, SOPs */
    if (l.indexOf(' ') > -1) { found[l] = 1; return; }              /* real two-word term */
    if (TOOL_WORDS.indexOf(l) > -1 || count(l) >= 2) found[l] = 1;
  });

  return Object.keys(found).slice(0, 30);
}

/* ─────────────────────── HUMANISER ───────────────────────
   Rewrites phrasing only. Never adds a fact.
─────────────────────────────────────────────────────────── */
var RULES = [
  { re: /^responsible for\s+/i,      to: '',    note: 'Passive opener. Start with the doing word instead.', cap: true },
  { re: /^duties included\s+/i,      to: '',    note: 'Reads as a job description, not an achievement.', cap: true },
  { re: /^tasked with\s+/i,          to: '',    note: 'Passive. What did you actually do?', cap: true },
  { re: /^in charge of\s+/i,         to: 'Ran ', note: 'Vague. "Ran" is concrete.' },
  { re: /^worked on\s+/i,            to: 'Built ', note: '"Worked on" could mean anything.' },
  { re: /^helped (?:to |with )?/i,   to: '',    note: 'Helped how? Claim your own contribution.', cap: true },
  { re: /^assisted (?:with |in )?/i, to: 'Supported ', note: '"Assisted" understates you.' },
  { re: /^involved in\s+/i,          to: '',    note: 'Being involved is not doing.', cap: true },
  { re: /\bleverag(e|ed|ing)\b/gi,   to: 'used', note: 'Corporate filler. "Used" is a real word.' },
  { re: /\butilis(e|ed|ing)\b/gi,    to: 'used', note: 'Say "used".' },
  { re: /\butiliz(e|ed|ing)\b/gi,    to: 'used', note: 'Say "used".' },
  { re: /\bspearhead(ed|ing)?\b/gi,  to: 'led',  note: 'Overused. "Led" reads as a person, not a press release.' },
  { re: /\bsynerg(y|ies|istic)\b/gi, to: '',     note: 'Nobody has ever been hired for a synergy. Cut it.' },
  { re: /\bwear(ing)? many hats\b/gi,to: '',     note: 'Cliché. Name the actual jobs you did.' },
  { re: /\bthink outside the box\b/gi,to: '',    note: 'Appears on tens of thousands of CVs. Cut it.' },
  { re: /\bresults[- ]driven\b/gi,   to: '',     note: 'Show the result instead of claiming to be driven by them.' },
  { re: /\bhard[- ]working\b/gi,     to: '',     note: 'Everyone claims this. Numbers prove it.' },
  { re: /\bteam player\b/gi,         to: '',     note: 'Unfalsifiable filler.' },
  { re: /\bpassionate about\b/gi,    to: '',     note: 'Claimed passion persuades nobody. Evidence does.' },
  { re: /\bdynamic\b/gi,             to: '',     note: 'Means nothing on a CV.' },
  { re: /\bgo[- ]getter\b/gi,        to: '',     note: 'Cut it.' },
  { re: /\bdetail[- ]oriented\b/gi,  to: '',     note: 'Show it with an error rate instead.' },
  { re: /\btrack record of\b/gi,     to: '',     note: 'Just state the record.' },
  { re: /\bproven ability to\b/gi,   to: '',     note: 'Prove it with the next clause instead of claiming it.' },
  { re: /\bstate[- ]of[- ]the[- ]art\b/gi, to: '', note: 'Marketing language.' },
  { re: /\bcutting[- ]edge\b/gi,     to: '',     note: 'Marketing language.' },
  { re: /\bseamless(ly)?\b/gi,       to: '',     note: 'Nothing is seamless. Say what happened.' },
  { re: /\brobust\b/gi,              to: '',     note: 'Vague.' },
  { re: /\bvarious\b/gi,             to: '',     note: '"Various" hides the number. Give the number.' },
  { re: /\bnumerous\b/gi,            to: '',     note: 'Give the number instead.' },
  { re: /\bsuccessfully\b/gi,        to: '',     note: 'If it was not successful you would not list it.' },
  { re: /\bin order to\b/gi,         to: 'to',   note: 'Three words doing one word\u2019s job.' },
  { re: /\bdelve(d|s)? into\b/gi,    to: 'looked at', note: 'A word people rarely use out loud.' },
  { re: /\btapestry\b/gi,            to: '',     note: 'Reads as machine-written.' },
  { re: /\bmeticulous(ly)?\b/gi,     to: '',     note: 'Reads as machine-written.' },
  { re: /\bkindly revert\b/gi,       to: 'let me know', note: 'Regional; reads as archaic to an international reader.' },
  { re: /\bdo the needful\b/gi,      to: '',     note: 'Regional; state the specific action instead.' }
];

function humanise() {
  var d = snapshot();
  var out = $('humanOut');
  var items = [];

  function scan(label, text, apply) {
    if (!text) return;
    text.split('\n').forEach(function (line, li) {
      var t = line.trim(); if (!t) return;
      RULES.forEach(function (r) {
        if (!r.re.test(t)) return;
        r.re.lastIndex = 0;
        var fixed = t.replace(r.re, r.to);
        if (r.cap) fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
        fixed = fixed.replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
        if (fixed === t || !fixed) return;
        items.push({ label: label, note: r.note, was: t, now: fixed, apply: apply, line: li });
        t = fixed;
      });
    });
  }

  scan('Summary', d.fSummary, function (v) { $('fSummary').value = v; });
  [].forEach.call(jobsEl.children, function (c, i) {
    scan('Role ' + (i + 1), c.querySelector('.j-bul').value, function (v) {
      c.querySelector('.j-bul').value = v;
    });
  });

  /* de-duplicate by original line, keeping the fully-rewritten version */
  var byLine = {};
  items.forEach(function (it) {
    var k = it.label + '::' + it.line;
    if (!byLine[k]) byLine[k] = { label: it.label, was: it.was, now: it.now, notes: [], apply: it.apply, line: it.line };
    byLine[k].now = it.now;
    if (byLine[k].notes.indexOf(it.note) === -1) byLine[k].notes.push(it.note);
  });
  var list = Object.keys(byLine).map(function (k) { return byLine[k]; });

  if (!list.length) {
    out.innerHTML = '<p class="clean">\u2713 Nothing flagged. No corporate filler, no passive openers, no phrases that read as machine-written. '
      + 'That is genuinely uncommon \u2014 most first drafts trip four or five of these.</p>'
      + '<div class="note"><b>One thing this cannot check.</b> Whether your bullets are true. '
      + 'Every number on this page has to survive an interviewer asking you about it, and you are the one who will be sitting there.</div>';
    return;
  }

  out.innerHTML = '<p class="hint" style="margin-bottom:0.9rem">Found <b>' + list.length + '</b> line'
    + (list.length > 1 ? 's' : '') + ' worth rewording. Each suggestion changes only the wording of a fact you already wrote.</p>'
    + list.map(function (it, i) {
        return '<div class="flag"><b>' + it.label + '</b> \u2014 ' + it.notes.join(' ')
          + '<br><span class="was">' + escHtml(it.was) + '</span>'
          + '<br><span class="now">' + escHtml(it.now) + '</span>'
          + '<br><button data-fix="' + i + '">Use the rewrite</button></div>';
      }).join('')
    + '<div class="note"><b>Read every rewrite before you accept it.</b> These rules are blunt on purpose. '
      + 'If cutting a word changes what you actually meant, keep your version \u2014 you know your work and the rule does not.</div>';

  out.querySelectorAll('button[data-fix]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = list[+b.getAttribute('data-fix')];
      var el = (it.label === 'Summary') ? $('fSummary')
             : jobsEl.children[parseInt(it.label.replace('Role ', ''), 10) - 1].querySelector('.j-bul');
      var lines = el.value.split('\n');
      lines[it.line] = it.now;
      el.value = lines.join('\n');
      render(); save(); humanise();
    });
  });
}
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ─────────────────────── PARSER ─────────────────────── */
function parseCv() {
  var raw = $('pasteCv').value;
  if (!raw.trim()) { $('parseOut').innerHTML = '<b>Nothing pasted yet.</b> Copy your CV text into the box above first.'; return; }
  var lines = raw.split('\n').map(function (l) { return l.replace(/\s+$/, ''); });
  var found = [];

  var em = raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (em) { $('fEmail').value = em[0]; found.push('email'); }
  var ph = raw.match(/(\+?\d[\d\s().-]{8,}\d)/);
  if (ph) { $('fPhone').value = ph[1].trim(); found.push('phone'); }
  var li = raw.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,|]+/i);
  if (li) { $('fLinkedin').value = li[0]; found.push('LinkedIn'); }
  var gh = raw.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|behance\.net|dribbble\.com|notion\.site)\/[^\s,|]+/i);
  if (gh) { $('fPortfolio').value = gh[0]; found.push('portfolio'); }
  var tz = raw.match(/UTC\s*[+\-]\s*\d{1,2}/i);
  if (tz) { $('fTz').value = tz[0].replace(/\s+/g, ''); found.push('timezone'); }

  /* City / country. Split ONLY on pipes and bullets — never on commas,
     because "Lagos, Nigeria" is itself comma-separated. */
  var contactLine = lines.filter(function (l) { return /@/.test(l); })[0] || '';
  var PLACE = /^[A-Z][A-Za-z.'\-]+(?:[ ][A-Z][A-Za-z.'\-]+){0,2}(?:,[ ]*[A-Z][A-Za-z.'\-]+(?:[ ][A-Z][A-Za-z.'\-]+){0,2})?$/;
  function tryPlace(t) {
    if ($('fCity').value) return;
    t = (t || '').trim().replace(/[.,;]+$/, '');
    if (!t || /@|http|utc|\d/i.test(t)) return;
    if (t.split(/[ ]+/).length > 5) return;
    if (t === $('fName').value) return;
    if (!PLACE.test(t)) return;
    $('fCity').value = t; found.push('location');
  }
  contactLine.split(/[|\u2022\u00b7]/).forEach(tryPlace);
  /* fall back: a standalone "City, Country" line near the top */
  if (!$('fCity').value) {
    lines.slice(0, 8).forEach(function (l) { if (/,/.test(l)) tryPlace(l); });
  }

  /* name: first non-empty line that is not a contact detail */
  for (var i = 0; i < Math.min(lines.length, 6); i++) {
    var l = lines[i].trim();
    if (!l || /@|\d{4}|http/.test(l)) continue;
    if (l.length < 60 && /^[A-Za-z][A-Za-z .'\-]+$/.test(l)) { $('fName').value = l; found.push('name'); break; }
  }

  /* ── SECTIONS ────────────────────────────────────────────────────────
     THE BUG THIS REPLACES: the old matcher knew a short list of literal
     headings and nothing else — so the engine could not read its OWN exports.
     The International template heads the skills block "CORE COMPETENCIES", the
     UK template uses "PERSONAL PROFILE" and "KEY SKILLS", and every template
     writes "EDUCATION & CERTIFICATIONS". None of those matched. An unmatched
     heading did not start a new section, so the heading AND everything under it
     were appended to whichever section came before — competencies landed inside
     Education, and the rebuilt CV came out scattered.
     Headings are now normalised (case, punctuation, ampersands) and mapped to
     one of six buckets, and every heading this engine can emit is in the list,
     so a document can be exported, re-imported and come back identical. */
  var HEAD_MAP = [
    ['summary', ['professional summary','summary','personal profile','profile','career summary','career profile',
                 'profile summary','about me','about','objective','career objective','personal statement',
                 'executive summary','professional profile']],
    ['experience', ['experience','work experience','professional experience','employment','employment history',
                    'work history','career history','relevant experience','professional background',
                    'experience and employment']],
    ['skills', ['skills','core skills','key skills','core competencies','competencies','key competencies',
                'areas of expertise','expertise','core strengths','strengths','skills summary',
                'professional skills','key strengths']],
    ['tools', ['tools','technology','technologies','technical skills','systems and tools','tools and technology',
               'tools and technologies','tech stack','software','platforms','technical proficiencies',
               'remote tools','collaboration tools','systems']],
    ['education', ['education','education and certifications','education and qualifications','qualifications',
                   'certifications','certification','academic background','education and training',
                   'training','education and professional development']],
    ['other', ['projects','key projects','awards','achievements','publications','languages','interests',
               'hobbies','references','volunteering','memberships','affiliations','additional information',
               'professional memberships']]
  ];
  function normHead(t) {
    return String(t).replace(/[\u2013\u2014]/g, '-').replace(/&/g, ' and ')
      .replace(/[^A-Za-z ]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function headBucket(line, inExp) {
    var t = String(line).trim();
    if (!t || t.length > 46) return null;
    if (/[.;@]|https?:|\d{4}/.test(t)) return null;          /* prose, contact, dated role line */
    var n = normHead(t);
    if (!n || n.split(' ').length > 4) return null;
    for (var i = 0; i < HEAD_MAP.length; i++) {
      if (HEAD_MAP[i][1].indexOf(n) > -1) return HEAD_MAP[i][0];
    }
    /* An ALL-CAPS line we do not recognise is almost certainly a heading, and
       letting it fall through is what caused the contamination above — so it
       CLOSES the current section. The one exception is inside Experience,
       where an all-caps line is usually a company or a role title and must
       stay with its bullets. */
    if (!inExp && t === t.toUpperCase() && /[A-Z]{3}/.test(t)) return 'other';
    return null;
  }
  var secs = { summary: [], experience: [], skills: [], tools: [], education: [], other: [] };
  var cur = null;
  lines.forEach(function (l) {
    var b = headBucket(l, cur === 'experience');
    if (b) { cur = b; return; }
    if (cur) secs[cur].push(l);
  });
  function pick(k) { return secs[k].join('\n').replace(/\n{3,}/g, '\n\n').trim(); }
  function commaJoin(t) {
    return t.split('\n').map(function (x) { return x.replace(/^[\u2022\-\u2013*\s]+/, '').trim(); })
      .filter(Boolean).join(', ');
  }

  var sum = pick('summary');
  if (sum) { $('fSummary').value = sum.replace(/\n+/g, ' ').trim(); found.push('summary'); }
  var sk = pick('skills');
  if (sk) { $('fSkills').value = commaJoin(sk); found.push('skills'); }
  var tl = pick('tools');
  if (tl) { $('fTools').value = commaJoin(tl); found.push('tools'); }
  var ed = pick('education');
  if (ed) { $('fEdu').value = ed.replace(/^[\u2022\-\u2013*]\s*/gm, '').trim(); found.push('education'); }

  /* Target job title: the line under the name, when it reads like a title and
     not like contact data. The field drives the line under your name in the
     document AND the export filename, so leaving it empty after an import made
     the whole target-role step look like it had done nothing. */
  if (!$('fTitle').value && $('fName').value) {
    var nameAt = -1;
    for (var ni = 0; ni < Math.min(lines.length, 8); ni++) {
      if (lines[ni].trim() === $('fName').value) { nameAt = ni; break; }
    }
    if (nameAt > -1) {
      for (var tj = nameAt + 1; tj < Math.min(lines.length, nameAt + 4); tj++) {
        var cand = lines[tj].trim().replace(/^[|\u2022\u00b7\-\s]+|[|\u2022\u00b7\-\s]+$/g, '');
        if (!cand) continue;
        if (/@|https?:|\d|utc/i.test(cand)) break;
        if (cand.length > 60 || cand.split(/\s+/).length > 7) break;
        if (headBucket(cand, false)) break;
        $('fTitle').value = cand; found.push('target title');
        break;
      }
    }
  }

  /* experience: split on lines that look like a header (contain a year range) */
  var exp = pick('experience');
  if (exp) {
    jobsEl.innerHTML = '';
    var xl = exp.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var DATE = /((?:19|20)\d{2}|[A-Z][a-z]{2}\.?\s*(?:19|20)\d{2})\s*(?:[\u2013\u2014\-]|to|until)+\s*((?:19|20)\d{2}|[A-Z][a-z]{2}\.?\s*(?:19|20)\d{2}|Present|Current|Now)/i;
    var ONLY_DATE = new RegExp('^\\s*(?:' + DATE.source + ')\\s*$', 'i');
    var blocks = [], b = null;
    for (var xi = 0; xi < xl.length; xi++) {
      var t = xl[xi];
      var isBullet = /^[\u2022\-\u2013*]/.test(t);
      var dm = t.match(DATE);
      var headHere = !isBullet && !!dm && t.length < 120;
      /* A ROLE HEADER CAN SPAN TWO LINES, and this engine's own export is
         exactly that shape: the role and employer on one line, the dates on
         the next. The old single-line test could not see it \u2014 it read the
         bare date line as the header, threw the real job title away, and glued
         the next role onto the previous role's bullets. A title line followed
         by a date-only line is now read as one header. */
      /* Real CVs also break the header over THREE lines \u2014 role, employer,
         dates \u2014 so look up to two lines ahead for a date-only line and treat
         everything above it as one header. */
      var dateAt = -1;
      if (!isBullet && !dm) {
        if (xi + 1 < xl.length && ONLY_DATE.test(xl[xi + 1])) dateAt = xi + 1;
        else if (xi + 2 < xl.length && ONLY_DATE.test(xl[xi + 2]) &&
                 !/^[\u2022\-\u2013*]/.test(xl[xi + 1]) && xl[xi + 1].length < 80) dateAt = xi + 2;
      }
      if (headHere || dateAt > -1) {
        if (b) blocks.push(b);
        b = { head: t, dates: dm ? dm[0] : '', bul: [] };
        if (dateAt > -1) {
          if (dateAt === xi + 2) b.head = t + ' | ' + xl[xi + 1];
          b.dates = xl[dateAt];
          xi = dateAt;
        }
      } else if (b) {
        b.bul.push(t.replace(/^[\u2022\-\u2013*]\s*/, ''));
      }
    }
    if (b) blocks.push(b);
    blocks.slice(0, 6).forEach(function (blk) {
      var rest = blk.head.replace(blk.dates, '')
        .replace(/[|,\u00b7\u2013\u2014\-]\s*$/, '').trim();
      var parts = rest.split(/\s*[|\u00b7,\u2013\u2014]\s*|\s+[\u2014\u2013-]\s+|\s+at\s+/i);
      addJob(true, { title: (parts[0] || '').trim(), co: (parts[1] || '').trim(),
        dates: blk.dates.trim(), loc: (parts[2] || '').trim(), bul: blk.bul.join('\n') });
    });
    if (blocks.length) found.push(blocks.length + ' role(s)');
  }
  if (!jobsEl.children.length) addJob(true);

  $('parseOut').innerHTML = found.length
    ? '<b>Pulled out:</b> ' + found.join(', ') + '. <b>Now go to step 2 and check every field.</b> '
      + 'Parsers guess at where a job title ends and a date begins, and they guess wrong often enough that you should not trust this without reading it.'
    : '<b>Could not find much.</b> That usually means the text came out of a PDF with a two-column layout \u2014 which is also why employers\u2019 systems cannot read it. Fill step 2 by hand; it will be faster.';
  render(); save(); go('s2');
}

/* One normalised model. The preview, the plain-text export and the .docx
   all build from this, so they cannot disagree about what the CV says. */
function model() {
  var d = snapshot();
  var c = [];
  if (d.fCity) c.push(d.fCity + (d.fTz ? ' | ' + d.fTz : ''));
  else if (d.fTz) c.push(d.fTz);
  if (d.fEmail) c.push(d.fEmail);
  if (d.fPhone) c.push(d.fPhone);
  if (d.fLinkedin) c.push(d.fLinkedin);
  if (d.fPortfolio) c.push(d.fPortfolio);

  /* Confirmed step-3 keywords are NOT appended here. They used to be, which
     meant the exported document contained words that appeared nowhere in the
     form the participant could see or edit — including, when the extractor
     misfired, the employer's own company name sitting in their competencies.
     Chips now write into the real Tools / Competencies field on confirmation,
     so the model only ever renders what is actually on screen. */
  var skills = d.fSkills;
  return {
    name: d.fName, title: d.fTitle, contact: c.join(' | '), summary: d.fSummary,
    jobs: d.jobs.map(function (j) {
      return { title: j.title, co: j.co, dates: j.dates, loc: j.loc,
        bullets: (j.bul || '').split('\n').map(function (x) { return x.trim().replace(/^[\u2022\-\u2013*]\s*/, ''); }).filter(Boolean) };
    }),
    /* skills is now BOTH: the raw string (kept for the 10-point checks and
       for anything that still wants one line) and a split list, because
       CORE COMPETENCIES renders as separate lines like EXPERIENCE. */
    skills: skills,
    /* Capitalised because these are now standalone lines, not items mid-sentence
       in a comma run. "ticket triage" reads as a fragment on its own bullet. */
    skillList: (skills || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)
      .map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }),
    tools: d.fTools,
    edu: (d.fEdu || '').split('\n').map(function (x) { return x.trim().replace(/^[\u2022\-\u2013*]\s*/, ''); }).filter(Boolean)
  };
}

/* ─────────────────────── RENDER ─────────────────────── */
function render() {
  var d = snapshot();

  /* checks */
  var results = CHECKS.map(function (c) {
    var r; try { r = c.run(d); } catch (e) { r = bad('Could not evaluate.'); }
    return { id: c.id, t: c.t, st: r.st, why: r.why };
  });
  var score = results.reduce(function (a, r) { return a + (r.st === 'pass' ? 1 : 0); }, 0);
  var partial = results.filter(function (r) { return r.st === 'part'; }).length;

  $('scoreN').innerHTML = score + '<small>/10</small>';
  var bar = $('scoreBar');
  bar.style.width = (score * 10) + '%';
  bar.style.background = score >= 8 ? 'var(--ok)' : (score >= 5 ? 'var(--warn)' : 'var(--bad)');
  $('verdict').innerHTML = score === 10
      ? 'Every point clear. This is the document to send.'
    : score >= 8
      ? 'Strong. ' + partial + ' point' + (partial === 1 ? '' : 's') + ' still partial \u2014 close ' + (partial === 1 ? 'it' : 'them') + ' and you are at 10.'
    : score >= 5
      ? 'Solid foundation. The amber and red points below are what is costing you callbacks.'
      : 'Structural work needed. Start with the red points \u2014 they are the ones that stop a human ever seeing this.';

  $('checks').innerHTML = results.map(function (r) {
    var mark = r.st === 'pass' ? '\u2713' : (r.st === 'part' ? '!' : '\u2715');
    return '<div class="chk"><span class="chk-dot ' + r.st + '">' + mark + '</span>'
      + '<span><span class="chk-t">' + String(r.id).padStart(2, '0') + ' \u00b7 ' + r.t + '</span>'
      + '<span class="chk-w">' + r.why + '</span></span></div>';
  }).join('');

  /* preview — uses the SAME model and the SAME headings as the .docx,
     so what a participant sees is what the exported file contains. */
  var m = model();
  var T = (window.ERJDocx && window.ERJDocx.TEMPLATES[tpl]) || { heads: {
    summary:'PROFESSIONAL SUMMARY', exp:'EXPERIENCE', skills:'CORE COMPETENCIES',
    tools:'TOOLS', edu:'EDUCATION & CERTIFICATIONS' }, showTitle: true };
  var H = T.heads;
  var html = '';
  html += '<h1>' + escHtml(m.name || 'Your Name') + '</h1>';
  if (T.showTitle && m.title) html += '<div class="cv-title">' + escHtml(m.title) + '</div>';
  if (m.contact) html += '<div class="cv-contact">' + escHtml(m.contact) + '</div>';
  if (m.summary) html += '<h2>' + H.summary + '</h2><p>' + escHtml(m.summary) + '</p>';
  if (m.jobs.length) {
    html += '<h2>' + H.exp + '</h2>';
    m.jobs.forEach(function (j) {
      html += '<div class="cv-job"><div class="cv-jt">' + escHtml(j.title || 'Role')
            + (j.co ? ' \u2014 ' + escHtml(j.co) : '') + '</div>';
      var meta = [j.dates, j.loc].filter(Boolean).map(escHtml).join(' | ');
      if (meta) html += '<div class="cv-jm">' + meta + '</div>';
      if (j.bullets.length) html += '<ul>' + j.bullets.map(function (x) { return '<li>' + escHtml(x) + '</li>'; }).join('') + '</ul>';
      html += '</div>';
    });
  }
  if (m.skillList.length) html += '<h2>' + H.skills + '</h2><ul class="cv-comp">'
    + m.skillList.map(function (x) { return '<li>' + escHtml(x) + '</li>'; }).join('') + '</ul>';
  if (m.tools)  html += '<h2>' + H.tools  + '</h2><p>' + escHtml(m.tools) + '</p>';
  if (m.edu.length) html += '<h2>' + H.edu + '</h2><ul>'
    + m.edu.map(function (x) { return '<li>' + escHtml(x) + '</li>'; }).join('') + '</ul>';

  $('preview').innerHTML = html;
  $('preview2').innerHTML = html;
}

/* ─────────────────────── JD PANEL ─────────────────────── */
function runJd() {
  var jd = val('fJd');
  if (!jd) { $('jdPanel').style.display = 'none'; $('tailorPanel').style.display = 'none'; return; }
  $('tailorPanel').style.display = '';
  var need = extractJd(jd, val('fJdCo'));
  var txt = allText(snapshot());
  $('jdPanel').style.display = '';
  if (!need.length) {
    $('jdChips').innerHTML = '';
    $('jdNote').innerHTML = '<b>Nothing recognisable came out of that.</b> Paste the full vacancy text including the requirements list.';
    return;
  }
  /* A term YOU confirmed is drawn as confirmed and stays removable, even though
     it now appears in the CV \u2014 which it does precisely because you confirmed
     it. Ranking "already present" first turned every confirmed chip green and
     locked it, so one mistap could not be undone from this panel. */
  var have = need.filter(function (k) {
    return txt.indexOf(k.toLowerCase()) > -1 && jdPicked.indexOf(k) === -1;
  });
  $('jdChips').innerHTML = need.map(function (k, i) {
    var isPicked = jdPicked.indexOf(k) > -1;
    var isHave = !isPicked && have.indexOf(k) > -1;
    return '<button class="chip ' + (isPicked ? 'on' : (isHave ? 'have' : '')) + '" data-k="' + i + '"'
      + (isPicked ? ' title="You added this. Tap to take it back out."' : '') + '>'
      + (isPicked ? '+ ' : (isHave ? '\u2713 ' : '')) + escHtml(k) + '</button>';
  }).join('');
  $('jdChips').querySelectorAll('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = need[+b.getAttribute('data-k')];
      if (jdPicked.indexOf(k) === -1 && have.indexOf(k) > -1) return;
      var i = jdPicked.indexOf(k);
      if (i > -1) { jdPicked.splice(i, 1); dropTerm(k); }
      else { jdPicked.push(k); addTerm(k); }
      runJd(); render(); save(); tailorPreview();
    });
  });
  tailorPreview();
  $('jdNote').innerHTML = '<b>' + have.length + ' of ' + need.length + '</b> of their terms already appear in your CV. '
    + 'Green ones are covered. Tap a grey chip only if you have genuinely done it \u2014 '
    + 'it is written straight into your <b>Tools</b> or <b>Core skills</b> line in step 2, where you can see and edit it. '
    + '<b>Adding a tool you have never used is discovered in the interview, and it ends the process.</b>';
}

/* ── WHERE A CONFIRMED CHIP GOES ───────────────────────────────────────
   A confirmed term is written into the field it actually belongs to — tools
   into the tools line, everything else into competencies — instead of being
   pinned invisibly onto the skills line at render time. Two reasons: the
   participant can see and edit what was added, and the preview can no longer
   contain a word that exists nowhere in the form. */
var TERM_CASE = { sops:'SOPs', csat:'CSAT', sql:'SQL', seo:'SEO', kpi:'KPIs', kpis:'KPIs', crm:'CRM',
  api:'API', apis:'APIs', saas:'SaaS', ui:'UI', ux:'UX', hr:'HR', it:'IT', qa:'QA', sla:'SLAs', slas:'SLAs' };
function niceTerm(k) {
  if (TERM_CASE[k]) return TERM_CASE[k];
  return String(k).replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
}
function fieldFor(k) { return TOOL_WORDS.indexOf(k) > -1 ? 'fTools' : 'fSkills'; }
function listOf(id) {
  return (val(id) || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
}
function addTerm(k) {
  var id = fieldFor(k), list = listOf(id), want = niceTerm(k);
  var has = list.some(function (x) { return x.toLowerCase() === want.toLowerCase(); });
  if (!has) { list.push(want); $(id).value = list.join(', '); }
}
function dropTerm(k) {
  var id = fieldFor(k), want = niceTerm(k).toLowerCase();
  $(id).value = listOf(id).filter(function (x) { return x.toLowerCase() !== want; }).join(', ');
}


/* ─────────────────────── TAILOR TO THE ROLE ───────────────────────
   Paste the vacancy, press one button, and the SAME facts are reordered so
   the ones the employer asked for are read first. Nothing is invented, no
   wording is changed and nothing is deleted — this only changes ORDER, plus
   the target title if you accept it. That distinction is the whole ethic of
   the tool: a recruiter reads the top third of a CV, so ordering is the one
   honest lever there is.
   tailorBackup holds the pre-tailor state so it is always reversible. */
var tailorBackup = null;

function jdTerms() {
  var jd = val('fJd');
  if (!jd) return [];
  var t = extractJd(jd, val('fJdCo')).slice(0, 40);
  /* picked chips count too — the participant confirmed those by hand */
  jdPicked.forEach(function (k) { if (t.indexOf(k) === -1) t.push(k); });
  return t;
}

/* Word stems from the vacancy. Exact-phrase matching alone is far too strict:
   a vacancy says "documentation" and the CV says "documented", it says
   "ticket triage" and the CV says "tickets". Matching on a 5-character stem
   catches those without the false positives a 3-character stem would give. */
var jdStemCache = { src: null, stems: null };

function stemsOf(text) {
  var out = {};
  (text || '').toLowerCase().replace(/[^a-z0-9\s+#.]/g, ' ').split(/\s+/).forEach(function (w) {
    if (w.length < 4) return;
    if (JD_STOP.indexOf(w) > -1) return;
    out[w.slice(0, 5)] = 1;
  });
  return out;
}

function jdStems() {
  var jd = val('fJd') || '';
  if (jdStemCache.src === jd) return jdStemCache.stems;
  jdStemCache = { src: jd, stems: stemsOf(jd) };
  return jdStemCache.stems;
}

/* how strongly one line answers this vacancy */
function relevance(line, terms) {
  if (!line) return 0;
  var low = ' ' + line.toLowerCase() + ' ';
  var score = 0;

  /* 1 · exact phrases and named tools carry the most weight */
  terms.forEach(function (k) {
    if (!k) return;
    if (low.indexOf(k.toLowerCase()) > -1) score += (k.indexOf(' ') > -1 ? 4 : 3);
  });

  /* 2 · stem overlap — the part that makes this work on real CVs */
  var stems = jdStems(), seen = {};
  Object.keys(stemsOf(line)).forEach(function (st) {
    if (stems[st] && !seen[st]) { seen[st] = 1; score += 1; }
  });

  /* 3 · a line carrying a number is evidence, and evidence outranks a keyword.
     Weighted at 3 rather than 2 so a quantified achievement is not demoted
     below a line whose only merit is that it echoes one word of the advert. */
  if (/\d/.test(line)) score += 3;
  return score;
}

/* Stable sort by score, descending — equal scores keep their original order,
   because chronology inside a role is meaningful.
   AND a list is only reordered when reordering is worth something. Sorting on
   tiny score differences shuffles a CV that was already in a deliberate order,
   and that is exactly what read as the tool \u201cscattering\u201d the document: the
   first bullet of a role is usually the strongest thing the person did, and
   demoting it to promote a keyword match makes the CV worse, not better. A
   line therefore only moves ahead of the incumbent leader when it beats it by
   REORDER_MARGIN or more. */
var REORDER_MARGIN = 4;
function byRelevance(arr, terms, get) {
  if (!arr || arr.length < 2) return arr;
  var scored = arr.map(function (v, i) { return { v: v, i: i, s: relevance(get ? get(v) : v, terms) }; });
  var lead = scored[0].s, best = lead;
  scored.forEach(function (o) { if (o.s > best) best = o.s; });
  if (best - lead < REORDER_MARGIN) return arr;
  return scored.slice().sort(function (a, b) { return b.s - a.s || a.i - b.i; })
    .map(function (o) { return o.v; });
}

function tailorPreview() {
  var terms = jdTerms();
  var box = $('tailorNote');
  if (!box) return;
  if (!terms.length) {
    box.innerHTML = '<b>Paste the vacancy above first.</b> The engine needs the employer\u2019s own words before it can put yours in their order.';
    $('tailorBtn').disabled = true;
    return;
  }
  $('tailorBtn').disabled = false;
  var d = snapshot();
  var hitJobs = 0, hitBul = 0, totalBul = 0;
  (d.jobs || []).forEach(function (j) {
    var bl = (j.bul || '').split('\n').filter(function (x) { return x.trim(); });
    totalBul += bl.length;
    var h = bl.filter(function (b) { return relevance(b, terms) >= 3; }).length;
    hitBul += h; if (h) hitJobs++;
  });
  box.innerHTML = '<b>' + terms.length + '</b> terms read from the vacancy. '
    + '<b>' + hitBul + '</b> of your ' + totalBul + ' experience lines already answer at least one of them, across '
    + hitJobs + ' role' + (hitJobs === 1 ? '' : 's') + '.<br><br>'
    + 'Tailoring reorders your competencies and the bullets inside each role so those lines are read first. '
    + '<b>It invents nothing, deletes nothing and rewords nothing</b> \u2014 your roles stay in date order and every line you wrote is still there.';
}

function applyTailor() {
  var terms = jdTerms();
  if (!terms.length) return;

  /* snapshot for undo, before anything moves */
  tailorBackup = {
    skills: val('fSkills'),
    title: val('fTitle'),
    jobs: readJobs().map(function (j) { return { title: j.title, co: j.co, dates: j.dates, loc: j.loc, bul: j.bul }; })
  };

  var moved = 0;

  /* 1 \u00b7 competencies, most-asked-for first */
  var sk = (val('fSkills') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  if (sk.length) {
    var skNew = byRelevance(sk, terms);
    if (skNew.join('|') !== sk.join('|')) { $('fSkills').value = skNew.join(', '); moved++; }
  }

  /* 2 \u00b7 bullets inside each role. Roles themselves are NOT reordered \u2014
         a CV out of date order reads as concealment. */
  var wraps = jobsEl.querySelectorAll('.roleblk');
  wraps.forEach(function (w) {
    var ta = w.querySelector('.j-bul');
    if (!ta) return;
    var lines = (ta.value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (lines.length < 2) return;
    var out = byRelevance(lines, terms);
    if (out.join('|') !== lines.join('|')) { ta.value = out.join('\n'); moved++; }
  });

  /* The advertised title is applied live by the target-role field itself as
     you type, so there is nothing to do for it here. */

  render(); save(); tailorPreview();
  var box = $('tailorNote');
  box.innerHTML = moved
    ? '<b>Reordered.</b> Competencies and the bullets inside each role now lead with what this employer asked for. '
      + 'Nothing was invented, deleted or reworded. <b>Read every line again before you export \u2014 it is still your CV, and you are the one in the interview.</b>'
    : '<b>Nothing needed moving.</b> The lines that answer this vacancy were already at the top of each section, '
      + 'so the engine left your order alone rather than shuffling it for the sake of it. '
      + 'The grey chips below are where the real gain is.';
  $('untailorBtn').style.display = moved ? '' : 'none';
  $('tailorBtn').textContent = moved ? 'Re-run the reorder' : 'Check again';
}

/* ── THE TARGET ROLE FIELD ─────────────────────────────────────────────
   "Role title as advertised" collected a value and then did nothing at all
   until you happened to press a button in a different panel further down the
   page \u2014 which is why the field read as broken. It now applies to the CV's
   target title as you type, says what it did, and puts it back in one click.
   titleBeforeTarget holds your own title so nothing is ever lost. */
var titleBeforeTarget = null;

function applyTargetTitle() {
  var adv = val('fJdRole'), note = $('jdRoleNote');
  if (!adv) {
    if (titleBeforeTarget !== null) { $('fTitle').value = titleBeforeTarget; titleBeforeTarget = null; }
    if (note) { note.innerHTML = ''; note.style.display = 'none'; }
    render(); save(); return;
  }
  if (titleBeforeTarget === null) titleBeforeTarget = val('fTitle');
  $('fTitle').value = adv;
  if (note) {
    note.style.display = '';
    note.innerHTML = 'Your CV now reads <b>' + escHtml(adv) + '</b> under your name'
      + (titleBeforeTarget ? ' (it read \u201c' + escHtml(titleBeforeTarget) + '\u201d)' : '')
      + '. That is the single highest-value edit on this page: a recruiter checks the line under your '
      + 'name against the advert before reading anything else. '
      + '<button type="button" class="linkbtn" id="jdRoleUndo">Keep my own title instead</button>';
    var u = $('jdRoleUndo');
    if (u) u.addEventListener('click', function () {
      $('fTitle').value = titleBeforeTarget || '';
      $('fJdRole').value = '';
      titleBeforeTarget = null;
      note.innerHTML = ''; note.style.display = 'none';
      render(); save(); runJd();
    });
  }
  render(); save();
}

function undoTailor() {
  if (!tailorBackup) return;
  $('fSkills').value = tailorBackup.skills;
  $('fTitle').value = tailorBackup.title;
  var wraps = jobsEl.querySelectorAll('.roleblk');
  wraps.forEach(function (w, i) {
    var j = tailorBackup.jobs[i]; if (!j) return;
    var ta = w.querySelector('.j-bul'); if (ta) ta.value = j.bul;
  });
  tailorBackup = null;
  render(); save(); tailorPreview();
  $('untailorBtn').style.display = 'none';
  $('tailorBtn').textContent = 'Reorder my CV for this role';
  $('tailorNote').innerHTML = '<b>Restored.</b> Your original order is back.';
}

/* ─────────────────────── EXPORT ─────────────────────── */
function plainText() {
  var m = model();
  var T = (window.ERJDocx && window.ERJDocx.TEMPLATES[tpl]) || { heads: {
    summary:'PROFESSIONAL SUMMARY', exp:'EXPERIENCE', skills:'CORE COMPETENCIES',
    tools:'TOOLS', edu:'EDUCATION & CERTIFICATIONS' }, showTitle: true };
  var H = T.heads, L = [];
  L.push(m.name || 'Your Name');
  if (T.showTitle && m.title) L.push(m.title);
  if (m.contact) L.push(m.contact);
  if (m.summary) { L.push('', H.summary, m.summary); }
  if (m.jobs.length) {
    L.push('', H.exp);
    m.jobs.forEach(function (j) {
      L.push('', (j.title || 'Role') + (j.co ? ' - ' + j.co : ''));
      var meta = [j.dates, j.loc].filter(Boolean).join(' | ');
      if (meta) L.push(meta);
      j.bullets.forEach(function (b) { L.push('- ' + b); });
    });
  }
  if (m.skillList.length) { L.push('', H.skills); m.skillList.forEach(function (x) { L.push('- ' + x); }); }
  if (m.tools)  L.push('', H.tools, m.tools);
  if (m.edu.length) { L.push('', H.edu); m.edu.forEach(function (e) { L.push('- ' + e); }); }
  return L.join('\n');
}

function fileName(ext) {
  var d = snapshot();
  var n = (d.fName || 'Your_Name').replace(/[^A-Za-z0-9]+/g, '_');
  var r = (d.fTitle || 'CV').replace(/[^A-Za-z0-9]+/g, '_');
  return n + '_' + r + '_CV.' + ext;
}
function dl(blob, name) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ─────────────────────── WIRING ─────────────────────── */
function renderTpl() {
  var host = $('tplPick'); if (!host || !window.ERJDocx) return;
  var T = window.ERJDocx.TEMPLATES;
  host.innerHTML = Object.keys(T).map(function (k) {
    return '<button class="chip ' + (k === tpl ? 'on' : '') + '" data-tpl="' + k + '">'
      + (k === tpl ? '\u2713 ' : '') + T[k].name + '</button>';
  }).join('');
  host.querySelectorAll('[data-tpl]').forEach(function (b) {
    b.addEventListener('click', function () {
      tpl = b.getAttribute('data-tpl'); renderTpl(); render(); save();
    });
  });
  $('tplNote').innerHTML = '<b>' + T[tpl].name + '.</b> ' + T[tpl].blurb;
}

window.go = function (id) {
  document.querySelectorAll('.step').forEach(function (s) { s.classList.toggle('on', s.id === id); });
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-step') === id); });
  if (id === 's4') humanise();
  if (id === 's3') runJd();
  if (id === 's5') renderTpl();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
document.querySelectorAll('.tab').forEach(function (t) {
  t.addEventListener('click', function () { go(t.getAttribute('data-step')); });
});
FIELDS.forEach(function (f) {
  var e = $(f); if (e) e.addEventListener('input', function () { render(); save(); });
});
$('btnAddJob').addEventListener('click', function () { addJob(); });
$('btnParse').addEventListener('click', parseCv);
$('btnJd').addEventListener('click', function () { runJd(); render(); save(); });
/* The vacancy box and the two fields beside it now work as you type. Requiring
   a button press before anything visibly happened was most of the reason this
   step felt dead. */
var jdTimer = null;
$('fJd').addEventListener('input', function () {
  window.clearTimeout(jdTimer);
  jdTimer = window.setTimeout(function () { runJd(); render(); save(); }, 600);
});
$('fJdCo').addEventListener('input', function () { runJd(); });
$('fJdRole').addEventListener('input', applyTargetTitle);
$('tailorBtn').addEventListener('click', applyTailor);
$('untailorBtn').addEventListener('click', undoTailor);
$('btnPdf').addEventListener('click', function () { window.print(); });
$('btnTxt').addEventListener('click', function () {
  navigator.clipboard.writeText(plainText()).then(
    function () { toast('Plain text copied \u2014 paste it into the portal box'); },
    function () { toast('Could not copy. Select the preview and copy by hand.'); });
});
$('btnDocx').addEventListener('click', function () {
  if (!window.ERJDocx) { toast('Export module did not load \u2014 refresh the page.'); return; }
  dl(window.ERJDocx.docxBlob(model(), tpl), fileName('docx'));
  toast('Real .docx downloaded \u2014 opens in Word, Google Docs and Pages.');
});

$('btnClear').addEventListener('click', function () {
  if (!confirm('Clear every field on this device? This cannot be undone.')) return;
  try { localStorage.removeItem(LS); } catch (e) {}
  FIELDS.forEach(function (f) { if ($(f)) $(f).value = ''; });
  jobsEl.innerHTML = ''; jdPicked = []; addJob(true);
  $('jdPanel').style.display = 'none'; render(); go('s1');
});
$('btnSample').addEventListener('click', function () {
  $('fName').value = 'Chidi Okafor';
  $('fTitle').value = 'Customer Support Specialist';
  $('fEmail').value = 'chidi.okafor@gmail.com';
  $('fPhone').value = '+234 803 000 0000';
  $('fCity').value = 'Abuja, Nigeria';
  $('fTz').value = 'UTC+1';
  $('fLinkedin').value = 'linkedin.com/in/chidiokafor';
  $('fPortfolio').value = 'chidiokafor.notion.site/support-portfolio';
  $('fSummary').value = 'Customer support specialist with four years handling high-volume queues for a Nigerian fintech. Cut average first-response time from eight hours to under two while holding satisfaction above 90 percent. Work written-first across distributed teams, documenting processes so colleagues in other time zones are never blocked waiting on me.';
  $('fSkills').value = 'Customer support, escalation management, ticket triage, technical troubleshooting, process documentation';
  $('fTools').value = 'Zendesk, Slack, Notion, Zoom, Google Workspace, Jira';
  $('fEdu').value = 'BSc Economics \u00b7 University of Lagos \u00b7 2019\nZendesk Support Administrator Certification \u00b7 2025';
  jobsEl.innerHTML = '';
  addJob(true, { title: 'Customer Support Officer', co: 'Paystack', dates: 'Jan 2023 \u2013 Mar 2025', loc: 'Lagos, Nigeria \u00b7 Hybrid',
    bul: 'Handled about 60 tickets a day across email and live chat for roughly 40,000 active users\nCut average first-response time from 8 hours to under 2 by rewriting reply templates and re-sorting the queue by issue type\nDocumented the five highest-volume issues into a help centre, removing about 30% of repeat tickets\nTrained four new support officers and wrote the onboarding runbook they still use' });
  addJob(true, { title: 'Bank Teller', co: 'First Bank', dates: 'Aug 2020 \u2013 Dec 2022', loc: 'Ibadan, Nigeria',
    bul: 'Processed about 120 customer transactions a day at an error rate under 1%\nResolved account disputes at first contact, escalating fewer than 5% to a supervisor' });
  render(); save(); go('s2');
  toast('Example loaded \u2014 a 10/10 document. Replace it with your own work.');
});

/* Auto-unlock last, once every function and variable above exists. */
try {
  var savedCode = localStorage.getItem(LSGATE);
  if (savedCode) tryGate(savedCode, true);
} catch (e) {}

function toast(t) {
  var el = document.createElement('div');
  el.textContent = t;
  el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9998;'
    + 'background:#111;color:#fff;padding:0.75rem 1.1rem;border-radius:10px;font-size:0.82rem;'
    + 'border:1px solid rgba(255,255,255,0.14);max-width:90vw;text-align:center;line-height:1.5;';
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 3800);
}
})();
