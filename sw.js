// Tiene la pagina delle presenze sul telefono, così si riapre anche senza rete (Aula Magna).
// Con la rete prende sempre la versione nuova; senza rete (o con rete lentissima, oltre 4 secondi) usa quella salvata.
var NOME = 'presenze-v1';
var FILE = ['./', './index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(NOME).then(function (c) { return c.addAll(FILE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== NOME; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  if (!/\/(index\.html)?$/.test(u.pathname)) return;
  e.respondWith(caches.open(NOME).then(function (c) {
    var rete = fetch(e.request, { cache: 'no-store' }).then(function (r) {
      if (r && r.ok) c.put('./index.html', r.clone());
      return r;
    });
    var attesa = new Promise(function (ok, no) { setTimeout(function () { no(new Error('lenta')); }, 4000); });
    return Promise.race([rete, attesa]).catch(function () {
      return c.match('./index.html').then(function (salvata) {
        return salvata || rete.catch(function () { return new Response('Senza rete', { status: 503 }); });
      });
    });
  }));
});
