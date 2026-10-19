/* ============================================================
   钖潯缈昏瘧 路 Service Worker
   绛栫暐锛歛pp shell 棰勭紦瀛?+ 缂撳瓨浼樺厛锛堢绾垮彲鐢級锛岄〉闈㈠鑸洖钀?index.html
   鏇存柊锛氭敼鍔ㄥ墠绔祫婧愬悗鎶?CACHE 鐗堟湰鍙?+1
   ============================================================ */
const CACHE = 'shutiao-v2';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './lexicon.js',
  './examples.js',
  './corpus.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});


