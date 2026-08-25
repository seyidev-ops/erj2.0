/* Everything Remote Job · true client-side PDF export.
   Uses the official ERJ light logo asset; no third-party service. */
(function(){
  'use strict';

  function ascii(v){
    return String(v==null?'':v)
      .replace(/[\u2018\u2019]/g,"'")
      .replace(/[\u201C\u201D]/g,'"')
      .replace(/[\u2013\u2014]/g,'-')
      .replace(/\u2026/g,'...')
      .replace(/\u00A0/g,' ')
      .replace(/[^\x20-\x7E\n]/g,'');
  }
  function esc(v){return ascii(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
  function wrap(text,max){
    var words=ascii(text).replace(/\s+/g,' ').trim().split(' ').filter(Boolean), out=[], line='';
    words.forEach(function(w){var n=line?line+' '+w:w;if(n.length>max&&line){out.push(line);line=w;}else line=n;});
    if(line)out.push(line);return out.length?out:[''];
  }
  function bytes(s){return new TextEncoder().encode(s);}
  function concat(parts){
    var len=parts.reduce(function(n,p){return n+p.length;},0), out=new Uint8Array(len), o=0;
    parts.forEach(function(p){out.set(p,o);o+=p.length;});return out;
  }

  function content(report,imgW,imgH){
    var c=[], y=655;
    function text(txt,x,yy,size,bold,orange){
      c.push((orange?'1 0.341 0.133':'0.078 0.067 0.055')+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x+' '+yy+' Td ('+esc(txt)+') Tj ET');
    }
    function block(txt,opt){
      opt=opt||{};var size=opt.size||10, lead=opt.leading||size+4, max=opt.max||84;
      wrap(txt,max).forEach(function(line){text(line,opt.x||54,y,size,!!opt.bold,!!opt.orange);y-=lead;});
      y-=opt.after||0;
    }
    function rule(yy){c.push('0.85 0.83 0.80 RG 0.8 w 54 '+yy+' m 541 '+yy+' l S');}

    // Logo — official attached light lockup, no recreated geometry.
    var logoW=250, logoH=Math.max(40,logoW*(imgH/imgW));
    c.push('q '+logoW+' 0 0 '+logoH+' 54 755 cm /Im1 Do Q');
    text('JOB SEARCH DIAGNOSTIC REPORT',54,715,20,true,false);
    text('Find your leak. Fix the earliest failing point first.',54,692,10,true,true);
    rule(674);

    y=648;
    block('PRIMARY LEAK',{size:8,bold:true,orange:true,after:12});
    block((report.number?report.number+' - ':'')+(report.joint||''),{size:24,bold:true,max:42,leading:27,after:2});
    block(report.law||'',{size:11,bold:true,max:78,leading:15,after:7});
    block(report.verdict||'',{size:10,max:90,leading:14,after:11});

    block('HOW YOUR ANSWERS FELL',{size:8,bold:true,orange:true,after:4});
    var scoreStart=y;
    (report.scores||[]).forEach(function(s){
      var active=s.name===report.joint;
      text(s.name,54,y,9,active,false);
      text(String(s.pct)+'%',178,y,9,true,active);
      var w=Math.max(4,Math.min(135,(+s.pct||0)*1.35));
      c.push('0.90 0.88 0.85 rg 225 '+(y-1)+' 135 7 re f');
      c.push((active?'1 0.341 0.133':'0.50 0.48 0.45')+' rg 225 '+(y-1)+' '+w+' 7 re f');
      y-=17;
    });
    y-=3;
    block('A close second is normal. Fix the earliest leak first; an upstream failure can make later readings unreliable.',{size:8,max:92,leading:11,after:10});

    block('WHAT I WOULD DO NOW',{size:8,bold:true,orange:true,after:4});
    block((report.actions&&report.actions[0])||'Fix the earliest failing point before increasing application volume.',{size:10,max:90,leading:14,after:11});

    block('GET A FREE HUMAN REVIEW',{size:8,bold:true,orange:true,after:4});
    block('The quiz identifies the joint. A human review can tell you what to fix first in your actual search.',{size:10,max:90,leading:14,after:4});
    block('Message ERJ with AUDIT and include: target role, applications in the last 30 days, interviews in the last 30 days, and your CV or LinkedIn profile.',{size:10,bold:true,max:90,leading:14,after:7});
    block('WhatsApp: +234 803 292 5957',{size:9,bold:true,orange:true,max:70});

    rule(59);
    text('Everything Remote Job  |  Work Beyond Borders.',54,40,8,true,false);
    text('everythingremotejob.com/diagnose/  |  Generated: '+ascii(report.date||new Date().toLocaleDateString('en-GB')),54,27,7,false,false);
    return c.join('\n')+'\n';
  }

  function makePdf(report,jpeg,imgW,imgH){
    var stream=bytes(content(report,imgW,imgH));
    var parts=[bytes('%PDF-1.4\n%ERJ\n')], offsets=[0], pos=parts[0].length;
    var objects=[];
    objects[1]=bytes('<< /Type /Catalog /Pages 2 0 R >>');
    objects[2]=bytes('<< /Type /Pages /Kids [5 0 R] /Count 1 >>');
    objects[3]=bytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects[4]=bytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    objects[5]=bytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 7 0 R >> >> /Contents 6 0 R >>');
    objects[6]=concat([bytes('<< /Length '+stream.length+' >>\nstream\n'),stream,bytes('endstream')]);
    objects[7]=concat([bytes('<< /Type /XObject /Subtype /Image /Width '+imgW+' /Height '+imgH+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n'),jpeg,bytes('\nendstream')]);

    for(var i=1;i<=7;i++){
      offsets[i]=pos;
      var head=bytes(i+' 0 obj\n'), tail=bytes('\nendobj\n');
      parts.push(head,objects[i],tail);pos+=head.length+objects[i].length+tail.length;
    }
    var xref=pos;
    var xr='xref\n0 8\n0000000000 65535 f \n';
    for(var j=1;j<=7;j++)xr+=String(offsets[j]).padStart(10,'0')+' 00000 n \n';
    xr+='trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    parts.push(bytes(xr));
    return new Blob(parts,{type:'application/pdf'});
  }

  async function download(report){
    try{
      var res=await fetch('erj-official-logo-light.jpg?v=126',{cache:'no-store'});
      if(!res.ok)throw new Error('logo');
      var jpeg=new Uint8Array(await res.arrayBuffer());
      // Cropped official logo asset is 1400x380.
      var blob=makePdf(report||{},jpeg,1400,380);
      var url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='ERJ-Job-Search-Diagnostic-'+ascii((report&&report.joint)||'Report').replace(/\s+/g,'-')+'.pdf';
      document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},2000);
    }catch(err){
      console.error('ERJ diagnostic PDF export failed',err);
      alert('The PDF could not be generated on this device. Please refresh once and try again.');
    }
  }
  window.ERJDiagnosticPDF={download:download,makePdf:makePdf};
})();
