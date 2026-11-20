// Tiene la pagina delle presenze sul telefono, così si riapre anche senza rete (Aula Magna).
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
  var pagina = /\/(index\.html)?$/.test(u.pathname);
  if (!pagina && !/\/sw\.js$/.test(u.pathname)) return;
  e.respondWith(caches.open(NOME).then(function (c) {
    var chiave = pagina ? './index.html' : e.request;
    return c.match(chiave, { ignoreSearch: true }).then(function (salvata) {
      var rete = fetch(e.request).then(function (r) {
        if (r && r.ok) c.put(chiave, r.clone());
        return r;
      }).catch(function () { return null; });
      if (salvata) { e.waitUntil(rete); return salvata; }
      return rete.then(function (r) { return r || new Response('Senza rete', { status: 503 }); });
    });
  }));
});
