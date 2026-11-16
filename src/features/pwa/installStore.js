import { useSyncExternalStore } from 'react'
import { isAndroid, isInAppBrowser, isIOS, isMacSafari, isStandalone } from './platform'

// Install state shared by the install sheet and every "Install app" button.
// beforeinstallprompt can fire before React mounts, so we listen from module load.
const DISMISS_KEY = 'pwa-install-dismissed-at'
const DISMISS_DAYS = 7

let deferredPrompt = null
let state = { canPrompt: false, installed: isStandalone(), open: false }
const listeners = new Set()
const set = (patch) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // hide Chrome's own mini-infobar; we show our sheet instead
    deferredPrompt = e
    set({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    set({ canPrompt: false, installed: true, open: false })
  })
  window.matchMedia('(display-mode: standalone)').addEventListener('change', () => set({ installed: isStandalone() }))
}

// prompt = one-tap native install (Chrome/Edge/Samsung, Android + desktop)
// ios = Share → Add to Home Screen steps; android = ⋮ menu steps; mac-safari = File → Add to Dock
// inapp = must open in a real browser first; installed / unsupported = show nothing
function modeOf(s) {
  if (s.installed) return 'installed'
  if (s.canPrompt) return 'prompt'
  if (isInAppBrowser) return 'inapp'
  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  if (isMacSafari) return 'mac-safari'
  return 'unsupported'
}

export function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000
  } catch {
    return false
  }
}

export const installActions = {
  open: () => set({ open: true }),
  close(remember = true) {
    if (remember) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
      } catch {
        // storage blocked: the sheet may show again next visit, which is fine
      }
    }
    set({ open: false })
  },
  // Shows the browser's own install dialog. Returns 'accepted' | 'dismissed'.
  async prompt() {
    if (!deferredPrompt) return 'dismissed'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    set({ canPrompt: false, open: false })
    return outcome
  },
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useInstall() {
  const s = useSyncExternalStore(subscribe, () => state)
  const mode = modeOf(s)
  return { mode, open: s.open, canInstall: mode !== 'installed' && mode !== 'unsupported' }
}
