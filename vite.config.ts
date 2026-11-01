import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Runtime part of sw.js; CACHE and PRECACHE are prepended at build time.
const SW_BODY = `
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('vuon-tu-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Built files have content hashes in their names, so a cached copy is always the right one.
// ignoreVary: dev/static servers often send "Vary: Origin", and module scripts carry an Origin header.
const MATCH = { ignoreVary: true, ignoreSearch: true };

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Fresh page when online, cached app shell when offline.
    event.respondWith(fetch(request).catch(() => caches.match('./', MATCH)));
    return;
  }
  event.respondWith(caches.match(request, MATCH).then((hit) => hit || fetch(request)));
});
`;

/**
 * Emits sw.js with every built file in its precache list, so the installed app
 * works fully offline from the first visit. The cache name changes whenever any
 * file changes, which makes the browser pick up new versions.
 */
function serviceWorker(): Plugin {
  return {
    name: 'vuon-tu-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const publicDir = new URL('./public/', import.meta.url);
      const publicFiles = readdirSync(publicDir).filter((f) => !f.startsWith('.'));
      // Every supported browser takes the .woff2 fonts, so the .woff fallbacks aren't worth caching.
      const files = [...Object.keys(bundle), ...publicFiles].filter((f) => !f.endsWith('.woff'));
      const hash = createHash('sha256').update(SW_BODY);
      for (const name of Object.keys(bundle).sort()) {
        const item = bundle[name];
        hash.update(name);
        hash.update(item.type === 'chunk' ? item.code : item.source);
      }
      for (const name of publicFiles.sort()) hash.update(readFileSync(new URL(name, publicDir)));
      const version = hash.digest('hex').slice(0, 12);
      const precache = ['./', ...files.map((f) => `./${f}`)];

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'vuon-tu-${version}';\nconst PRECACHE = ${JSON.stringify(precache)};\n${SW_BODY}`,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  // All lesson data ships in the main bundle on purpose so the app works offline right away.
  build: { chunkSizeWarningLimit: 1500 },
});
