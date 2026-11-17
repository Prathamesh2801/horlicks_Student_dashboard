import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IoShareOutline } from 'react-icons/io5'
import {
  MdAddBox,
  MdArrowDownward,
  MdArrowUpward,
  MdBolt,
  MdCheckCircle,
  MdContentCopy,
  MdDownload,
  MdHome,
  MdMoreVert,
  MdOpenInFull,
  MdToggleOn,
  MdWifiOff,
} from 'react-icons/md'
import { Button, Modal } from '../../components/ui'
import { installActions, recentlyDismissed, useInstall } from './installStore'
import { iosBrowser, isIOS, isIPad } from './platform'

// When the sheet opens by itself on a first visit (ms). Android waits for Chrome's install event,
// which can take a few seconds, so it only falls back to manual steps if the event never comes.
const AUTO_OPEN_DELAY = { prompt: 1500, ios: 2500, inapp: 2500, android: 10000 }

const BENEFITS = [
  { icon: MdWifiOff, text: 'Works offline: visits and photos are saved on your phone' },
  { icon: MdOpenInFull, text: 'Opens full screen, like a normal app' },
  { icon: MdBolt, text: 'One tap from your home screen' },
]

function AppCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-page p-3">
      <motion.img
        src="./pwa-192x192.png"
        alt=""
        className="size-14 rounded-2xl shadow-md"
        initial={{ scale: 0.8, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      />
      <div className="min-w-0">
        <p className="font-bold">My Workbench</p>
        <p className="text-xs text-gray-500">Horlicks School Activity</p>
        <p className="text-xs font-semibold text-green-700">Free · less than 1 MB</p>
      </div>
    </div>
  )
}

function Benefits() {
  return (
    <ul className="mt-4 space-y-2">
      {BENEFITS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-sm text-gray-700">
          <Icon className="size-5 shrink-0 text-brand-700" /> {text}
        </li>
      ))}
    </ul>
  )
}

function Step({ n, icon: Icon, children }) {
  return (
    <li className="flex items-center gap-3">
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
        <Icon className="size-6" />
        <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
          {n}
        </span>
      </span>
      <div className="text-sm leading-snug text-gray-800">{children}</div>
    </li>
  )
}

const Key = ({ children }) => (
  <span className="mx-0.5 inline-block rounded-md bg-white px-1.5 py-0.5 text-[13px] font-semibold text-gray-900 ring-1 ring-gray-200">
    {children}
  </span>
)

// Where the Share button is, per iOS browser.
const iosShareHint = () => {
  if (iosBrowser === 'chrome') return { where: 'in the address bar at the top', arrow: 'top' }
  if (iosBrowser === 'safari' && isIPad) return { where: 'at the top right of Safari', arrow: 'top' }
  if (iosBrowser === 'safari') return { where: 'in Safari’s bar at the bottom. On newer iPhones tap ••• first', arrow: 'bottom' }
  return { where: 'in the browser menu', arrow: 'bottom' }
}

// Bouncing arrow pointing at the browser's Share button (outside the page).
function ShareArrow({ position }) {
  const top = position === 'top'
  const Icon = top ? MdArrowUpward : MdArrowDownward
  return (
    <motion.div
      className={`pointer-events-none fixed z-[1250] flex flex-col items-center gap-1 ${top ? 'right-4 top-2' : 'bottom-2 left-1/2 -translate-x-1/2'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: top ? [0, -8, 0] : [0, 8, 0] }}
      transition={{ y: { repeat: Infinity, duration: 1.1 }, opacity: { duration: 0.3 } }}
      aria-hidden="true"
    >
      {top && <Icon className="size-10 text-white drop-shadow-lg" />}
      <span className="flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
        Tap <IoShareOutline className="size-4" /> Share
      </span>
      {!top && <Icon className="size-10 text-white drop-shadow-lg" />}
    </motion.div>
  )
}

function IosGuide() {
  const { where } = iosShareHint()
  const device = isIPad ? 'iPad' : 'iPhone'
  return (
    <>
      <ol className="mt-4 space-y-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
        <Step n={1} icon={IoShareOutline}>
          Tap <Key>Share</Key> {where}.
        </Step>
        <Step n={2} icon={MdAddBox}>
          Scroll down and tap <Key>Add to Home Screen</Key>.
        </Step>
        <Step n={3} icon={MdToggleOn}>
          Keep <Key>Open as Web App</Key> switched on (if you see it), then tap <Key>Add</Key>.
        </Step>
        <Step n={4} icon={MdHome}>
          Open <b>My Workbench</b> from your {device} Home Screen.
        </Step>
      </ol>
      <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
        <b>Important:</b> after installing, always use the Home Screen app, not Safari. Your visits and offline drafts are saved
        inside the app. You will sign in once more there.
      </p>
    </>
  )
}

function AndroidSteps() {
  return (
    <ol className="mt-4 space-y-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
      <Step n={1} icon={MdMoreVert}>
        Tap the browser menu <Key>⋮</Key> at the top right.
      </Step>
      <Step n={2} icon={MdDownload}>
        Tap <Key>Install app</Key> or <Key>Add to Home screen</Key>.
      </Step>
      <Step n={3} icon={MdHome}>
        Tap <Key>Install</Key>, then open <b>My Workbench</b> from your home screen.
      </Step>
    </ol>
  )
}

function InAppSteps() {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard?.writeText(location.href).then(
      () => setCopied(true),
      () => {},
    )
  return (
    <div className="mt-4 space-y-3 rounded-xl bg-brand-50 p-4 text-sm text-gray-800 ring-1 ring-brand-100">
      <p>
        This link opened inside another app (WhatsApp, Instagram…), which can’t install apps. Open it in{' '}
        <b>{isIOS ? 'Safari' : 'Chrome'}</b>: tap <Key>⋮</Key> or <Key>•••</Key> and choose <Key>Open in browser</Key>.
      </p>
      <Button variant="secondary" className="w-full" onClick={copy}>
        {copied ? <MdCheckCircle className="size-5 text-green-600" /> : <MdContentCopy className="size-5" />}
        {copied ? 'Link copied. Paste it in your browser' : 'Copy link'}
      </Button>
    </div>
  )
}

const TITLES = {
  prompt: 'Install My Workbench',
  ios: `Install on your ${isIPad ? 'iPad' : 'iPhone'}`,
  android: 'Install My Workbench',
  inapp: 'Open in your browser to install',
  'mac-safari': 'Add to your Dock',
}
const SUBTITLES = {
  ios: 'Free · no App Store needed · takes 20 seconds',
  inapp: 'One more step before installing',
}

// Asks the user to install the app, with the right flow for their device.
export default function InstallPrompt() {
  const { mode, open } = useInstall()
  const [busy, setBusy] = useState(false)

  // Opens by itself on a first visit; after ✕ it stays closed for 7 days (the Install app buttons still open it).
  useEffect(() => {
    const delay = AUTO_OPEN_DELAY[mode]
    if (delay == null || recentlyDismissed()) return
    const timer = setTimeout(installActions.open, delay)
    return () => clearTimeout(timer)
  }, [mode])

  if (mode === 'installed' || mode === 'unsupported') return null

  const install = async () => {
    setBusy(true)
    const outcome = await installActions.prompt()
    setBusy(false)
    if (outcome !== 'accepted') installActions.close(true)
  }
  const close = () => installActions.close(true)
  const iosArrow = mode === 'ios' && open ? iosShareHint().arrow : null

  return (
    <>
      <Modal
        open={open}
        title={TITLES[mode]}
        subtitle={SUBTITLES[mode]}
        onClose={close}
        placement={iosArrow === 'bottom' ? 'top' : 'auto'}
      >
        <AppCard />

        {mode === 'prompt' && (
          <>
            <Benefits />
            <Button size="xl" className="mt-5 w-full" onClick={install} loading={busy}>
              <MdDownload className="size-5" /> Install app
            </Button>
          </>
        )}

        {mode === 'ios' && (
          <>
            <IosGuide />
            <Button className="mt-4 w-full" onClick={close}>
              Got it
            </Button>
          </>
        )}

        {mode === 'android' && (
          <>
            <AndroidSteps />
            <Button className="mt-4 w-full" onClick={close}>
              Got it
            </Button>
          </>
        )}

        {mode === 'inapp' && <InAppSteps />}

        {mode === 'mac-safari' && (
          <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm text-gray-800 ring-1 ring-brand-100">
            In the menu bar choose <Key>File</Key> → <Key>Add to Dock</Key>, then click <Key>Add</Key>.
          </p>
        )}
      </Modal>
      {iosArrow && <ShareArrow position={iosArrow} />}
    </>
  )
}
