/* ============================================================
   薯条翻译 · Service Worker
   策略：app shell 预缓存 + 缓存优先（离线可用），页面导航回落 index.html
   更新：静默自动 —— 版本变化时新 SW 立刻接管，页面自行刷新一次
        改动前端资源后把 CACHE 版本号 +1
   ============================================================ */
const CACHE = 'shutiao-v3';

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

// 主线程说"立刻接管"时，跳过等待（静默自动更新的关键一步）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

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
  // 版本文件必须实时走网络，不能被缓存（否则永远看不到新版本）
  if (url.pathname.endsWith('/version.json')) return;

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
