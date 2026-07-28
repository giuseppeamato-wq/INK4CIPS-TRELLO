// Deliberately minimal: this app is a live multi-user tool (board state,
// Server Actions, WebSocket realtime) where stale cached responses would be
// actively harmful, so this service worker exists only to satisfy PWA
// installability criteria — it does no offline caching of its own.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let every request go to the network as normal.
});
