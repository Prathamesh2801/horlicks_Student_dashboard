// Browser/OS detection for the install flow. Only used to pick which instructions to show.
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

// iPadOS reports itself as a Mac, so also check for touch.
export const isIOS =
  /iphone|ipad|ipod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isIPad = isIOS && (/ipad/i.test(ua) || !/iphone|ipod/i.test(ua))
export const isAndroid = /android/i.test(ua)

// Facebook, Instagram, LINE, Snapchat and Android WebViews (WhatsApp etc.) can't install apps.
export const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|Snapchat|; wv\)/i.test(ua)

// Which browser on iOS (all can "Add to Home Screen" since iOS 16.4, from different menus).
export const iosBrowser = !isIOS ? null : /CriOS/.test(ua) ? 'chrome' : /FxiOS/.test(ua) ? 'firefox' : /EdgiOS/.test(ua) ? 'edge' : 'safari'

// Laptops and desktops (Windows, Mac, Linux, ChromeOS): only the wording of the install sheet changes.
export const isDesktop = !isIOS && !isAndroid

export const isMacSafari = !isIOS && /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    navigator.standalone === true)
