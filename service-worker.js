const C='projectforge-v1',A=['./','index.html','style.css','app.js','storage.js','zip.js','manifest.json','assets/icon.svg','assets/icon-192.png','assets/icon-512.png'];
self.oninstall=e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));
self.onactivate=e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim()));
self.onfetch=e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(C).then(x=>x.put(e.request,c));return n}).catch(()=>caches.match('index.html'))))};
