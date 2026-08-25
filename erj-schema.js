/* Shared Organization + WebSite structured data, injected on every public
   page so Google resolves ONE consistent entity for the brand instead of
   inferring a different one per page. Product schema stays inline. */
(function(){
  var d = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://everythingremotejob.com/#organization",
      "name": "Everything Remote Job",
      "alternateName": "ERJ",
      "url": "https://everythingremotejob.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://everythingremotejob.com/icon512.png",
        "width": 512,
        "height": 512
      },
      "description": "Everything Remote Job trains and places African professionals into globally competitive, dollar-paying remote roles.",
      "parentOrganization": {
        "@type": "Organization",
        "name": "Business Play Limited"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Abuja",
        "addressCountry": "NG"
      },
      "areaServed": [
        {
          "@type": "Place",
          "name": "Africa"
        },
        {
          "@type": "Place",
          "name": "Nigeria"
        }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "telephone": "+234-803-292-5957",
        "availableLanguage": [
          "en"
        ]
      },
      "foundingDate": "2013",
      "founder": {
        "@id": "https://everythingremotejob.com/#oluwaseyi-ashiru"
      }
    },
    {
      "@type": "Person",
      "@id": "https://everythingremotejob.com/#oluwaseyi-ashiru",
      "name": "Oluwaseyi Ashiru",
      "givenName": "Oluwaseyi",
      "familyName": "Ashiru",
      "jobTitle": "Lead Facilitator",
      "description": "Founder and Lead Facilitator of Everything Remote Job. Has trained professionals into globally competitive remote roles since 2013.",
      "url": "https://everythingremotejob.com/#about",
      "image": "https://everythingremotejob.com/founder-oluwaseyi.jpg",
      "worksFor": {
        "@id": "https://everythingremotejob.com/#organization"
      },
      "knowsAbout": [
        "Remote work",
        "Global job search",
        "CV and LinkedIn optimisation",
        "Asynchronous communication",
        "Salary negotiation"
      ],
      "sameAs": [
        "https://www.linkedin.com/in/oluwaseyiashiru/"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://everythingremotejob.com/#website",
      "url": "https://everythingremotejob.com/",
      "name": "Everything Remote Job",
      "publisher": {
        "@id": "https://everythingremotejob.com/#organization"
      },
      "author": {
        "@id": "https://everythingremotejob.com/#oluwaseyi-ashiru"
      },
      "inLanguage": "en",
      "copyrightYear": 2026,
      "copyrightHolder": {
        "@type": "Organization",
        "name": "Business Play Limited",
        "alternateName": "Everything Remote Job"
      },
      "license": "All rights reserved. ERJ frameworks, curriculum and paid participant resources may not be republished, resold or redistributed without written permission.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://everythingremotejob.com/blog.html?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};
  var s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(d);
  document.head.appendChild(s);

  function meta(name, content) {
    if (document.head.querySelector('meta[name="'+name+'"]')) return;
    var m=document.createElement('meta'); m.name=name; m.content=content; document.head.appendChild(m);
  }
  meta('copyright','Copyright 2026 Business Play Limited, trading as Everything Remote Job. All rights reserved.');
  meta('rights','ERJ frameworks, curriculum and paid participant resources may not be republished, resold or redistributed without written permission.');

  window.addEventListener('DOMContentLoaded', function(){
    if (document.querySelector('.erj-rights-line')) return;
    var foot=document.querySelector('footer');
    if (!foot) return;
    var n=document.createElement('div');
    n.className='erj-rights-line';
    n.setAttribute('role','note');
    n.innerHTML='© 2026 Business Play Limited · Everything Remote Job. Built for <span style="color:var(--accent,#FF5722)">global career scale.</span> All rights reserved. ERJ frameworks, curriculum and paid resources are not licensed for redistribution. <a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a>';
    n.style.cssText='max-width:900px;margin:1rem auto 0;padding-top:.85rem;border-top:1px solid rgba(127,127,127,.18);font-size:.68rem;line-height:1.55;letter-spacing:.02em;opacity:.72;text-align:center;';
    Array.prototype.forEach.call(n.querySelectorAll('a'),function(a){a.style.cssText='color:#FF5722;text-decoration:none;';});
    foot.appendChild(n);
  });
})();