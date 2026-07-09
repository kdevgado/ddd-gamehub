const CACHE_NAME = "ddd-game-hub-v2";

const APP_SHELL = [
  "/manifest.webmanifest",
  "/images/mask-transparent.gif",
  "/images/werewolf-transparent.gif",
  "/images/gun-transparent.gif",
  "/images/bomb-transparent.gif",
  "/images/spy-transparent.gif",
  "/icons/fullscreen.png",
  "/icons/imposter/bible.png",
  "/icons/imposter/custom.png",
  "/icons/imposter/filipino.png",
  "/icons/imposter/food.png",
  "/icons/imposter/movies.png",
  "/icons/imposter/objects.png",
  "/icons/imposter/place.png",
  "/icons/imposter/scj.png",
  "/icons/mafia/citizen.png",
  "/icons/mafia/detective.png",
  "/icons/mafia/doctor.png",
  "/icons/mafia/spy.png",
  "/icons/werewolf/bodygaurd.png",
  "/icons/werewolf/cupid.png",
  "/icons/werewolf/cursed.png",
  "/icons/werewolf/doctor.png",
  "/icons/werewolf/hunter.png",
  "/icons/werewolf/seer.png",
  "/icons/werewolf/villager.png",
  "/icons/werewolf/werewolf.png"
];

async function cachePageWithBuildAssets(cache, pageUrl) {
  const response = await fetch(pageUrl, { cache: "reload" });
  if (!response.ok) throw new Error(`Could not cache ${pageUrl}`);

  await cache.put(pageUrl, response.clone());
  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith("//"));

  await cache.addAll([...new Set(assetUrls)]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.all([
          cachePageWithBuildAssets(cache, "/"),
          cachePageWithBuildAssets(cache, "/index.html"),
          cachePageWithBuildAssets(cache, "/pass-the-phone.html")
        ]);
        await cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("ddd-game-hub-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const url = new URL(request.url);
    const cachedPage = await cache.match(request);
    if (cachedPage) return cachedPage;
    if (url.pathname.startsWith("/pass-the-phone")) {
      return cache.match("/pass-the-phone.html");
    }
    return cache.match("/index.html");
  }
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
  } catch {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });
    return cachedResponse || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(networkFirstAsset(request));
});
