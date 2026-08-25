/* ═══════════════════════════════════════════════════════════════════
   ERJ CV ENGINE — FILE IMPORT (.docx / .pdf)
   ═══════════════════════════════════════════════════════════════════
   Reads a Word or PDF CV entirely in the browser and hands the text to
   the same parser the paste box uses. Nothing is uploaded anywhere.

   .docx — parsed natively. A .docx is a ZIP; we read the central
     directory ourselves and inflate word/document.xml with the
     browser's built-in DecompressionStream. No library.

   .pdf  — extracted with a locally vendored copy of pdf.js
     (./vendor/pdf.min.mjs + worker), loaded lazily the first time a
     PDF is chosen so everyone else never downloads it. pdf.js runs
     100% client-side; the file never leaves the device.

   Honest limit, stated in the UI: a scanned PDF (a photograph of a
   printed CV) contains no text layer, so nothing can be extracted —
   the user is told plainly and pointed at the paste box.
═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

function $(id) { return document.getElementById(id); }

/* ────────────────────────────────────────────────
   DOCX: minimal ZIP reader + document.xml → text
──────────────────────────────────────────────── */

async function inflateRaw(bytes) {
  var ds = new DecompressionStream('deflate-raw');
  var stream = new Blob([bytes]).stream().pipeThrough(ds);
  var buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/* Find a file inside a ZIP by walking the central directory backwards
   from the End Of Central Directory record. Returns Uint8Array. */
async function zipExtract(buffer, wantedName) {
  var b = new Uint8Array(buffer);
  var dv = new DataView(buffer);

  // End Of Central Directory: signature 50 4B 05 06, scan from the end
  var eocd = -1;
  for (var i = b.length - 22; i >= Math.max(0, b.length - 65558); i--) {
    if (b[i] === 0x50 && b[i + 1] === 0x4B && b[i + 2] === 0x05 && b[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .docx (no ZIP directory found).');

  var count = dv.getUint16(eocd + 10, true);
  var cdOfs = dv.getUint32(eocd + 16, true);

  var p = cdOfs;
  for (var n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    var method   = dv.getUint16(p + 10, true);
    var cSize    = dv.getUint32(p + 20, true);
    var nameLen  = dv.getUint16(p + 28, true);
    var extraLen = dv.getUint16(p + 30, true);
    var cmtLen   = dv.getUint16(p + 32, true);
    var lhOfs    = dv.getUint32(p + 42, true);
    var name = '';
    for (var c = 0; c < nameLen; c++) name += String.fromCharCode(b[p + 46 + c]);

    if (name === wantedName) {
      // Local header: its own name/extra lengths may differ from the CD copy
      if (dv.getUint32(lhOfs, true) !== 0x04034b50) throw new Error('Corrupt .docx entry.');
      var lNameLen  = dv.getUint16(lhOfs + 26, true);
      var lExtraLen = dv.getUint16(lhOfs + 28, true);
      var dataStart = lhOfs + 30 + lNameLen + lExtraLen;
      var data = b.slice(dataStart, dataStart + cSize);
      if (method === 0) return data;                 // stored
      if (method === 8) return inflateRaw(data);     // deflated
      throw new Error('Unsupported compression inside .docx.');
    }
    p += 46 + nameLen + extraLen + cmtLen;
  }
  throw new Error('This file does not contain a Word document body — is it really a .docx?');
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, function (_, h) { return String.fromCodePoint(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (_, d) { return String.fromCodePoint(parseInt(d, 10)); })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/* document.xml → plain text, one line per paragraph.
   Tabs become " | " so pipe-separated contact rows survive for the
   parser (which splits city lines on pipes and bullets, never commas). */
function docxXmlToText(xml) {
  var out = [];
  var paras = xml.split(/<w:p[ >]/); // first chunk is pre-body, harmless
  for (var i = 1; i < paras.length; i++) {
    var chunk = paras[i];
    var end = chunk.indexOf('</w:p>');
    if (end >= 0) chunk = chunk.slice(0, end);

    var line = '';
    // Walk runs in order: text, tabs, breaks
    var re = /<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g;
    var m;
    while ((m = re.exec(chunk)) !== null) {
      if (m[0].indexOf('<w:tab') === 0) line += ' | ';
      else if (m[0].indexOf('<w:br') === 0) line += '\n';
      else line += decodeEntities(m[1]);
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function readDocx(file) {
  var buf = await file.arrayBuffer();
  var xmlBytes = await zipExtract(buf, 'word/document.xml');
  var xml = new TextDecoder('utf-8').decode(xmlBytes);
  return docxXmlToText(xml);
}

/* ────────────────────────────────────────────────
   PDF: lazy-loaded, locally vendored pdf.js
──────────────────────────────────────────────── */

var pdfLibPromise = null;
function loadPdfJs() {
  if (!pdfLibPromise) {
    pdfLibPromise = import('./vendor/pdf.min.mjs').then(function (lib) {
      lib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', location.href).href;
      return lib;
    });
  }
  return pdfLibPromise;
}

/* Rebuild reading order: pdf.js gives positioned fragments; we start a
   new line whenever the baseline (transform[5]) moves, and join
   fragments on one baseline with spaces where there is a real gap. */
async function readPdf(file, onStatus) {
  onStatus('Loading PDF reader…');
  var pdfjs = await loadPdfJs();
  var buf = await file.arrayBuffer();
  var doc = await pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise;

  var pages = [];
  for (var p = 1; p <= doc.numPages; p++) {
    onStatus('Reading page ' + p + ' of ' + doc.numPages + '…');
    var page = await doc.getPage(p);
    var tc = await page.getTextContent();

    var lines = [];
    var line = '';
    var lastY = null, lastEndX = null;
    for (var i = 0; i < tc.items.length; i++) {
      var it = tc.items[i];
      if (!('str' in it)) continue;
      var y = it.transform[5];
      var x = it.transform[4];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (line.trim()) lines.push(line.trimEnd());
        line = '';
        lastEndX = null;
      }
      if (line && lastEndX !== null && x - lastEndX > 1 && !/\s$/.test(line)) line += ' ';
      line += it.str;
      lastY = y;
      lastEndX = x + (it.width || 0);
      if (it.hasEOL) {
        if (line.trim()) lines.push(line.trimEnd());
        line = '';
        lastY = null;
        lastEndX = null;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
    pages.push(lines.join('\n'));
    page.cleanup();
  }
  try { doc.destroy(); } catch (e) {}
  return pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ────────────────────────────────────────────────
   UI wiring
──────────────────────────────────────────────── */

var busy = false;

function setStatus(msg, kind) {
  var el = $('impStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
  el.style.color = kind === 'err' ? '#e5484d' : kind === 'ok' ? 'var(--accent)' : '';
}

function deliver(text, label) {
  var ta = $('pasteCv');
  ta.value = text;
  // Let the engine's own listeners (autosave etc.) see the change
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  setStatus('Read ' + label + ' — ' + text.split('\n').filter(function (l) { return l.trim(); }).length
    + ' lines extracted. Pulling it apart into fields…', 'ok');
  $('btnParse').click();
}

async function handleFile(file) {
  if (busy || !file) return;
  var name = (file.name || '').toLowerCase();
  var isDocx = /\.docx$/.test(name);
  var isDoc  = /\.doc$/.test(name);
  var isPdf  = /\.pdf$/.test(name) || file.type === 'application/pdf';

  if (isDoc && !isDocx) {
    setStatus('That is an old-format .doc file. Open it in Word and use File → Save As → .docx, then upload again — or just copy the text into the paste box below.', 'err');
    return;
  }
  if (!isDocx && !isPdf) {
    setStatus('Upload a .docx or .pdf file. For anything else, copy the text into the paste box below.', 'err');
    return;
  }
  if (typeof DecompressionStream === 'undefined' && isDocx) {
    setStatus('Your browser is too old to read Word files here. Copy the text into the paste box below instead.', 'err');
    return;
  }

  busy = true;
  try {
    if (isDocx) {
      setStatus('Reading your Word file…');
      var t = await readDocx(file);
      if (!t || t.replace(/\s/g, '').length < 40) {
        setStatus('That document appears to be empty. Check the file, or paste the text below.', 'err');
      } else {
        deliver(t, '“' + file.name + '”');
      }
    } else {
      var t2 = await readPdf(file, function (m) { setStatus(m); });
      if (!t2 || t2.replace(/\s/g, '').length < 40) {
        setStatus('No readable text found — this PDF is likely a scan (a photo of a printed CV has no text layer). Nothing can be extracted from it here. Retype or paste your CV below, or upload the original Word file.', 'err');
      } else {
        deliver(t2, '“' + file.name + '”');
      }
    }
  } catch (err) {
    setStatus('Could not read that file: ' + (err && err.message ? err.message : err)
      + ' You can always copy the text and use the paste box below.', 'err');
  }
  busy = false;
}

function init() {
  var drop = $('impDrop');
  var input = $('impFile');
  if (!drop || !input) return;

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', function () {
    if (input.files && input.files[0]) handleFile(input.files[0]);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
