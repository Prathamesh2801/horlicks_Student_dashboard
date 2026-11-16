import { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { MdCloudDone, MdSystemUpdate, MdWifi, MdWifiOff } from 'react-icons/md'
import { Button } from '../../components/ui'

const subscribe = (cb) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}
const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine)

const Toast = ({ tone, icon: Icon, children }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 16 }}
    role="status"
    className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${tone}`}
  >
    <Icon className="size-5 shrink-0" />
    <div className="min-w-0 flex-1">{children}</div>
  </motion.div>
)

// Offline / back-online notice, "ready to work offline", and "new version" prompt.
export default function PwaStatus() {
  const online = useOnline()
  const [backOnline, setBackOnline] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for a new version every hour for tabs left open all day.
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    let timer
    const onOnline = () => {
      setBackOnline(true)
      clearTimeout(timer)
      timer = setTimeout(() => setBackOnline(false), 3000)
    }
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('online', onOnline)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-28 z-[1150] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 sm:items-stretch">
      <AnimatePresence>
        {!online && (
          <Toast key="offline" tone="bg-amber-50 text-amber-900 ring-amber-200" icon={MdWifiOff}>
            <b>You’re offline.</b> Saved pages and data still work.
          </Toast>
        )}
        {online && backOnline && (
          <Toast key="online" tone="bg-green-50 text-green-800 ring-green-200" icon={MdWifi}>
            Back online
          </Toast>
        )}
        {offlineReady && (
          <Toast key="ready" tone="bg-white text-gray-800 ring-gray-200" icon={MdCloudDone}>
            App saved on this device. It now works offline.
          </Toast>
        )}
        {needRefresh && (
          <Toast key="update" tone="bg-brand-700 text-white ring-brand-800" icon={MdSystemUpdate}>
            <div className="flex items-center gap-2">
              <span className="flex-1">A new version is ready.</span>
              <button onClick={() => setNeedRefresh(false)} className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10">
                Later
              </button>
              <Button variant="secondary" size="sm" onClick={() => updateServiceWorker(true)}>
                Reload
              </Button>
            </div>
          </Toast>
        )}
      </AnimatePresence>
    </div>
  )
}
