const VERSION='__BUILD_VERSION__';
const PREFIX='agenda-smeraldo-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+VERSION;
const FILES=['./','./index.html','./app.css','./app.js','./model.js','./initial-data.js','./storage.js','./pwa.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;if(event.request.mode==='navigate'){event.respondWith((async()=>{const cached=await(await caches.open(CACHE)).match('./index.html');return cached||fetch(event.request);})());return;}event.respondWith((async()=>{const cache=await caches.open(CACHE),stored=await cache.match(event.request);if(stored)return stored;return fetch(event.request);})());});
