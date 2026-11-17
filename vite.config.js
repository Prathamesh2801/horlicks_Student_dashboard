import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { config } from "./src/config/config.js";

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const server = new URL(config.BASE_URL_SERVER);

// /server-api/* (config.API_PROXY) is forwarded to the PHP API from this PC, in `npm run dev` and `npm run preview`,
// so a phone on an https tunnel works too (no mixed-content block, no need to be on the office LAN).
// In production the web server does the same forwarding (docs/SERVER_API.md → Deploying).
const proxyPath = config.API_PROXY || "/server-api";
const serverApiProxy = {
  [proxyPath]: {
    target: server.origin,
    changeOrigin: true,
    rewrite: (path) => server.pathname.replace(/\/$/, "") + path.slice(proxyPath.length),
  },
};
// URLs the service worker caches: through the proxy path, or the server directly when API_PROXY is ''.
const apiUrl = config.API_PROXY ? `${escapeRegExp(config.API_PROXY)}/` : `^${escapeRegExp(config.BASE_URL_SERVER)}/`;

export default defineConfig({
  base: "./",
  server: {
    host: true,
    proxy: serverApiProxy,
  },
  preview: {
    host: true,
    proxy: serverApiProxy,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a new version waits until the user taps Reload, so a visit in progress is never interrupted.
      registerType: "prompt",
      // Serve the manifest + service worker in `npm run dev` too, so the app can be installed/tested via a tunnel.
      // suppressWarnings: dev-dist has no built files to precache, so workbox's "glob matches nothing" warning is expected.
      devOptions: { enabled: true, type: "module", navigateFallback: "index.html", suppressWarnings: true },
      includeAssets: ["icon.svg", "favicon-64.png", "apple-touch-icon.png"],
      manifest: {
        id: "./",
        name: "My Workbench — Horlicks School Activity",
        short_name: "My Workbench",
        description: "Capture school activity visits, photos and AI student counts. Works offline.",
        lang: "en-IN",
        theme_color: "#0f3b84",
        background_color: "#f5f6fa",
        display: "standalone",
        orientation: "any",
        start_url: "./#/",
        scope: "./",
        categories: ["productivity", "education", "business"],
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Start new visit",
            short_name: "New visit",
            url: "./#/staff/visits/new",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Map tiles already viewed stay available offline.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Visit photos (random file names, never change): keep the ones already viewed for offline use.
            urlPattern: new RegExp(`${apiUrl}uploads/`),
            handler: "CacheFirst",
            options: {
              cacheName: "visit-photos",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Real API reads: fresh when online, last saved copy when offline. Cleared on logout.
            urlPattern: new RegExp(apiUrl),
            method: "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "api",
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});
