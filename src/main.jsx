import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../global.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

async function clearDevelopmentOfflineCache() {
  const hadController = Boolean(navigator.serviceWorker.controller);
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith("ddd-game-hub-"))
      .map((cacheName) => caches.delete(cacheName))
  );

  if (hadController && !sessionStorage.getItem("ddd-dev-cache-cleared")) {
    sessionStorage.setItem("ddd-dev-cache-cleared", "true");
    window.location.reload();
  }
}

function registerOfflineWorker() {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) registerOfflineWorker();
  else clearDevelopmentOfflineCache().catch(() => {});
}
