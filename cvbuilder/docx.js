/* ═══════════════════════════════════════════════════════════════════
   ERJ CV ENGINE — TEMPLATES + REAL .DOCX EXPORT
   ═══════════════════════════════════════════════════════════════════

   WHY THIS FILE EXISTS
   The first version exported a ".doc" that was actually an HTML document
   with a Word MIME type. Word opens it, but it is not a real Office file:
   some ATS parsers reject it outright, and others read the raw HTML tags
   as if they were content. That is the opposite of what this tool is for.

   This writes a genuine OOXML .docx — a real ZIP containing real
   document.xml and styles.xml — with no external library. It uses the
   ZIP "store" method (no compression), which Word and every parser
   accepts, so there is no deflate dependency.

   TEMPLATES
   Three layouts, all ATS-safe. They differ in the SECTION NAMES and
   density that different markets expect, not in structure — every one is
   single column, standard headings, no tables, no graphics, no columns,
   no text boxes, no headers or footers.
═══════════════════════════════════════════════════════════════════ */
(function (root) {
'use strict';

/* ───────────────────────── TEMPLATES ───────────────────────── */
var TEMPLATES = {
  intl: {
    name: 'International Standard',
    blurb: 'The safest default. Neutral section names understood everywhere, and the one to use when you do not know where the employer is.',
    heads: { summary:'PROFESSIONAL SUMMARY', exp:'EXPERIENCE', skills:'CORE COMPETENCIES',
             tools:'TOOLS', edu:'EDUCATION & CERTIFICATIONS' },
    showTitle: true, rule: true, bodyPt: 11, namePt: 19, gapPt: 10
  },
  us: {
    name: 'US / North America',
    blurb: 'What American recruiters and Workday-style systems expect. No photo, no date of birth, no marital status \u2014 including any of those gets a US application discarded.',
    heads: { summary:'PROFESSIONAL SUMMARY', exp:'PROFESSIONAL EXPERIENCE', skills:'CORE COMPETENCIES',
             tools:'TECHNICAL SKILLS', edu:'EDUCATION' },
    showTitle: true, rule: true, bodyPt: 11, namePt: 20, gapPt: 10
  },
  uk: {
    name: 'UK / Europe',
    blurb: 'British and European convention. Slightly denser, "Work Experience" and "Key Skills" as headings, which is what recruiters there scan for.',
    heads: { summary:'PERSONAL PROFILE', exp:'WORK EXPERIENCE', skills:'KEY SKILLS',
             tools:'SYSTEMS & TOOLS', edu:'EDUCATION & QUALIFICATIONS' },
    showTitle: false, rule: true, bodyPt: 10.5, namePt: 18, gapPt: 8
  }
};

/* ───────────────────── MINIMAL ZIP WRITER ─────────────────────
   Store method only. Enough for a valid .docx and small enough to read.
─────────────────────────────────────────────────────────────── */
var CRC_TABLE = (function () {
  var t = new Uint32Array(256), c, n, k;
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function utf8(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  var s = unescape(encodeURIComponent(str)), a = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
}
function dosTime(d) {
  return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
}
function dosDate(d) {
  return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
}
function zip(files) {
  var now = new Date(), chunks = [], central = [], offset = 0;
  function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  files.forEach(function (f) {
    var nameB = utf8(f.name), dataB = utf8(f.data), crc = crc32(dataB);
    var lh = [].concat([0x50,0x4B,0x03,0x04], u16(20), u16(0), u16(0),
      u16(dosTime(now)), u16(dosDate(now)), u32(crc), u32(dataB.length), u32(dataB.length),
      u16(nameB.length), u16(0));
    chunks.push(new Uint8Array(lh), nameB, dataB);
    central.push({ name: nameB, crc: crc, size: dataB.length, off: offset });
    offset += lh.length + nameB.length + dataB.length;
  });

  var cd = [], cdSize = 0;
  central.forEach(function (c) {
    var h = [].concat([0x50,0x4B,0x01,0x02], u16(20), u16(20), u16(0), u16(0),
      u16(dosTime(now)), u16(dosDate(now)), u32(c.crc), u32(c.size), u32(c.size),
      u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off));
    cd.push(new Uint8Array(h), c.name);
    cdSize += h.length + c.name.length;
  });
  var eocd = new Uint8Array([].concat([0x50,0x4B,0x05,0x06], u16(0), u16(0),
    u16(central.length), u16(central.length), u32(cdSize), u32(offset), u16(0)));

  return new Blob(chunks.concat(cd, [eocd]), {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

/* ───────────────────── OOXML BUILDING ───────────────────── */
function xesc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\u0000-\u0008|\u000B|\u000C|\u000E-\u001F/g, '');
}
function half(pt) { return Math.round(pt * 2); }          /* Word sizes are half-points */
function twips(pt) { return Math.round(pt * 20); }

function para(o) {
  o = o || {};
  var pPr = '<w:pPr>';
  if (o.style) pPr += '<w:pStyle w:val="' + o.style + '"/>';
  pPr += '<w:spacing w:before="' + twips(o.before || 0) + '" w:after="' + twips(o.after == null ? 3 : o.after) + '" w:line="' + Math.round((o.line || 1.15) * 240) + '" w:lineRule="auto"/>';
  if (o.bullet) pPr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="360" w:hanging="180"/>';
  if (o.rule) pPr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="808080"/></w:pBdr>';
  if (o.align) pPr += '<w:jc w:val="' + o.align + '"/>';
  pPr += '</w:pPr>';

  var runs = (o.runs || []).map(function (r) {
    var rPr = '<w:rPr>';
    rPr += '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>';
    if (r.b) rPr += '<w:b/>';
    if (r.i) rPr += '<w:i/>';
    if (r.caps) rPr += '<w:caps/>';
    rPr += '<w:sz w:val="' + half(r.pt || o.pt || 11) + '"/><w:szCs w:val="' + half(r.pt || o.pt || 11) + '"/>';
    if (r.color) rPr += '<w:color w:val="' + r.color + '"/>';
    rPr += '</w:rPr>';
    return '<w:r>' + rPr + '<w:t xml:space="preserve">' + xesc(r.t) + '</w:t></w:r>';
  }).join('');

  return '<w:p>' + pPr + runs + '</w:p>';
}

var STYLES_XML =
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
'<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' +
'<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault>' +
'<w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
'<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
'<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/>' +
'<w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>' +
'<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>' +
'<w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:sz w:val="23"/></w:rPr></w:style>' +
'<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>' +
'<w:pPr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>' +
'<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style>' +
'</w:styles>';

var NUMBERING_XML =
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
'<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>' +
'<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="\u2022"/>' +
'<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>' +
'<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>' +
'</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

/* ───────────────────── DOCUMENT ASSEMBLY ───────────────────── */
function buildBody(d, tpl) {
  var T = TEMPLATES[tpl] || TEMPLATES.intl;
  var H = T.heads, body = [];

  body.push(para({ pt: T.namePt, after: 1, runs: [{ t: d.name || 'Your Name', b: true, pt: T.namePt }] }));
  if (T.showTitle && d.title) {
    body.push(para({ pt: T.bodyPt + 0.5, after: 2, runs: [{ t: d.title, b: true, pt: T.bodyPt + 0.5, color: '333333' }] }));
  }
  if (d.contact) {
    body.push(para({ pt: T.bodyPt - 1.2, after: 6, runs: [{ t: d.contact, pt: T.bodyPt - 1.2, color: '333333' }] }));
  }

  function heading(txt) {
    body.push(para({ style: 'Heading1', pt: T.bodyPt + 0.5, before: T.gapPt, after: 3, rule: T.rule,
      runs: [{ t: txt, b: true, caps: true, pt: T.bodyPt + 0.5 }] }));
  }

  if (d.summary) { heading(H.summary); body.push(para({ pt: T.bodyPt, after: 3, runs: [{ t: d.summary, pt: T.bodyPt }] })); }

  if (d.jobs && d.jobs.length) {
    heading(H.exp);
    d.jobs.forEach(function (j, i) {
      var line = (j.title || 'Role') + (j.co ? ' \u2014 ' + j.co : '');
      body.push(para({ style: 'Heading2', pt: T.bodyPt, before: i ? 5 : 1, after: 0,
        runs: [{ t: line, b: true, pt: T.bodyPt }] }));
      var meta = [j.dates, j.loc].filter(Boolean).join(' | ');
      if (meta) body.push(para({ pt: T.bodyPt - 1.2, after: 2, runs: [{ t: meta, pt: T.bodyPt - 1.2, color: '444444' }] }));
      (j.bullets || []).forEach(function (b) {
        body.push(para({ pt: T.bodyPt, after: 1, bullet: true, style: 'ListParagraph', runs: [{ t: b, pt: T.bodyPt }] }));
      });
    });
  }

  /* CORE COMPETENCIES renders as separate bulleted lines, the same shape as
     EXPERIENCE. A comma-run of fifteen terms on one line is technically
     parseable but reads as filler to a human and is skipped. */
  if (d.skillList && d.skillList.length) {
    heading(H.skills);
    d.skillList.forEach(function (sk) {
      body.push(para({ pt: T.bodyPt, after: 1, bullet: true, style: 'ListParagraph', runs: [{ t: sk, pt: T.bodyPt }] }));
    });
  } else if (d.skills) {
    heading(H.skills); body.push(para({ pt: T.bodyPt, after: 3, runs: [{ t: d.skills, pt: T.bodyPt }] }));
  }
  if (d.tools)  { heading(H.tools);  body.push(para({ pt: T.bodyPt, after: 3, runs: [{ t: d.tools,  pt: T.bodyPt }] })); }
  if (d.edu && d.edu.length) {
    heading(H.edu);
    d.edu.forEach(function (e) {
      body.push(para({ pt: T.bodyPt, after: 1, bullet: true, style: 'ListParagraph', runs: [{ t: e, pt: T.bodyPt }] }));
    });
  }
  return body.join('');
}

function docxBlob(d, tpl) {
  var doc =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:body>' + buildBody(d, tpl) +
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
  '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="0" w:footer="0" w:gutter="0"/>' +
  '</w:sectPr></w:body></w:document>';

  var ct =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
  '</Types>';

  var rels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
  '</Relationships>';

  var docRels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
  '</Relationships>';

  var iso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  var core =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
  'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
  '<dc:title>' + xesc((d.name || 'CV') + ' \u2014 ' + (d.title || 'CV')) + '</dc:title>' +
  '<dc:creator>' + xesc(d.name || '') + '</dc:creator>' +
  '<cp:lastModifiedBy>' + xesc(d.name || '') + '</cp:lastModifiedBy>' +
  '<dcterms:created xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:created>' +
  '<dcterms:modified xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:modified>' +
  '</cp:coreProperties>';

  var app =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
  '<Application>ERJ CV Engine</Application></Properties>';

  return zip([
    { name: '[Content_Types].xml', data: ct },
    { name: '_rels/.rels',         data: rels },
    { name: 'word/document.xml',   data: doc },
    { name: 'word/_rels/document.xml.rels', data: docRels },
    { name: 'word/styles.xml',     data: STYLES_XML },
    { name: 'word/numbering.xml',  data: NUMBERING_XML },
    { name: 'docProps/core.xml',   data: core },
    { name: 'docProps/app.xml',    data: app }
  ]);
}

root.ERJDocx = { TEMPLATES: TEMPLATES, docxBlob: docxBlob };
})(typeof window !== 'undefined' ? window : globalThis);
