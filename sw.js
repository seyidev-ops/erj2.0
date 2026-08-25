/* ═══════════════════════════════════════════════════════
   EVERYTHING REMOTE JOB — SERVICE WORKER
   Cache-first for app shell, network-first for fonts
═══════════════════════════════════════════════════════ */
const CACHE   = 'erj-20260825-scan-blank-and-cv-target-fix';
const OFFLINE = '/offline.html';

const SHELL = [
  '/index.html',
  '/register.html',
  '/foundationtraining/index.html',
  '/jobapplication/index.html',
  '/selflearn/index.html',
  '/self-learn-vs-foundation-training.html',
  '/preview-compare.jpg',
  '/selflearn-box-wide.png',
  '/selflearn-box.webp',
  '/selflearn-box-wide.webp',
  '/preview-selflearn.jpg',
  '/cvscan/index.html',
  '/masterclass/index.html',
  '/innercircle/index.html',
  '/blog.html',
  '/blog/index.html',
  '/free.html',
  '/starting-line.html',
  '/testimonials.html',
  '/erj-nav.js',
  '/erj-track.js',
  '/founder-oluwaseyi.webp',
  '/erj-theme.js',
  '/erj-product.js',
  '/erj-passcode.js',
  '/404.html',
  '/erj-schema.js',
  '/erj-mark-dark.png',
  '/erj-lockup-dark.png',
  '/erj-ascend.js',
  '/preview-diagnose.jpg',
  '/preview-starting-line.jpg',
  '/preview-free.jpg',
  '/preview-index.jpg',
  '/diagnose/dx.js',
  '/diagnose/report-pdf.js',
  '/diagnose/index.html',
  '/erj-capture.js',
  '/erj-config.js',
  '/sitemap.xml',
  '/product.css',
  '/manifest.json',
  '/erj-mark-dark-128.png',
  '/erj-mark-light-128.png',
  '/favicon32-dark.png',
  '/founder-oluwaseyi.jpg',
  '/photo-remote-win.webp',
  '/photo-dollars-hand.webp',
  '/photo-dollars-woman.webp',
  '/photo-woman-laptop.webp',
  '/photo-facilitator-smile.webp',
  '/photo-facilitator-suit.webp',
  '/photo-billboard.webp',
  '/icon192.png',
  '/icon512.png',
  '/favicon32.png',
  OFFLINE,
];

self.addEventListener('install', e => {
  // First-ever install (no worker before us): take over straight away — there is
  // no page mid-read to disturb. An UPDATE must NOT skipWaiting: doing so swaps
  // the controller under a page someone is reading, which is what produced the
  // white-out mid-scroll. The new worker activates the next time every tab of
  // the site is closed. HTML is network-first anyway, so nobody sees stale copy.
  const firstInstall = !self.registration.active;
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(function(){ return null; }))
      ))
      /* firstInstall was being COMPUTED AND THEN IGNORED — skipWaiting() ran
         unconditionally, which is precisely what the comment above says must
         not happen on an update: it swaps the controller out from under a page
         someone is reading. Now it is actually honoured. */
      .then(() => { if (firstInstall) return self.skipWaiting(); })
  );
});

// An explicit opt-in escape hatch: a page can ask for the update immediately
// (e.g. behind a "new version — refresh" button) instead of it being forced.
self.addEventListener('message', e => {
  if (e.data === 'ERJ_SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      // NOTE: the old clients.navigate() "self-heal" lived here and reloaded
      // every open tab on activation — a 2-5s white screen for anyone mid-page.
      // It was also redundant: the fetch handler below is network-first for
      // HTML, so a published change is already live on the next page view.
  );
});

// Hosts that must always go straight to the network. Serving a cached
// pixel script — or worse, a cached event beacon — silently breaks
// reporting in a way that is very hard to notice.
const NO_SW_HOSTS = [
  'connect.facebook.net',
  'facebook.com',
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'analytics.tiktok.com',
  'doubleclick.net'
];

const PRIVATE_PATHS = [
  '/dashboard.html', '/participant.html', '/login.html',
  '/admin.html', '/admin-login.html', '/instructor.html', '/instructor-login.html',
  '/cvbuilder/'
];
function isPrivatePath(pathname) {
  return PRIVATE_PATHS.some(function(p){ return p.endsWith('/') ? pathname.startsWith(p) : pathname === p; });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Analytics and pixels: bypass the service worker entirely.
  if (NO_SW_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return;

  // Private/account pages must never be written to the service-worker cache.
  // In the current static architecture the browser must fetch them from the network.
  if (url.origin === self.location.origin && isPrivatePath(url.pathname)) return;

  if (url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // HTML pages: NETWORK-FIRST — published updates always show; cache is only the offline fallback.
  const isHTML = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE)))
    );
    return;
  }

  // Static assets (css/js/images): STALE-WHILE-REVALIDATE — instant from cache, silently refreshed in background.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', e => {
  let data; try { data = e.data.json(); } catch (x) { data = { title: 'Everything Remote Job', body: 'You have an update!' }; }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon192.png',
      badge: '/icon192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard.html' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
