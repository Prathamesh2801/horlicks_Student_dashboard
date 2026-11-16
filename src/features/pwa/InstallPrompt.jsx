import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IoShareOutline } from 'react-icons/io5'
import { MdAddBox, MdBolt, MdCheckCircle, MdContentCopy, MdMoreVert, MdOpenInFull, MdWifiOff } from 'react-icons/md'
import { Button, Modal } from '../../components/ui'
import { installActions, recentlyDismissed, useInstall } from './installStore'
import { iosBrowser, isIOS, isIPad } from './platform'

const AUTO_OPEN_DELAY = 4000
// Modes worth opening by themselves; mac-safari only opens from an "Install app" button.
const AUTO_MODES = ['prompt', 'ios', 'android', 'inapp']

const BENEFITS = [
  { icon: MdWifiOff, text: 'Works offline, even in schools with weak network' },
  { icon: MdOpenInFull, text: 'Opens full screen, like a normal app' },
  { icon: MdBolt, text: 'One tap from your home screen or desktop' },
]

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">{n}</span>
      <div className="pt-0.5 text-sm text-gray-800">{children}</div>
    </li>
  )
}

const Key = ({ icon: Icon, children }) => (
  <span className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 align-middle text-[13px] font-semibold text-gray-900 ring-1 ring-gray-200">
    {Icon && <Icon className="size-4 text-brand-700" />}
    {children}
  </span>
)

function IosSteps() {
  const where =
    iosBrowser === 'safari'
      ? isIPad
        ? 'at the top right of Safari'
        : 'at the bottom of Safari (on newer iPhones it is inside the ••• menu)'
      : iosBrowser === 'chrome'
        ? 'in the address bar at the top'
        : 'in the browser menu'
  return (
    <ol className="space-y-3">
      <Step n={1}>
        Tap <Key icon={IoShareOutline}>Share</Key> {where}.
      </Step>
      <Step n={2}>
        Scroll down and tap <Key icon={MdAddBox}>Add to Home Screen</Key>. Tap <b>View More</b> if you don’t see it.
      </Step>
      <Step n={3}>
        Tap <Key>Add</Key>. <b>My Workbench</b> appears on your home screen. Open it from there.
      </Step>
    </ol>
  )
}

function AndroidSteps() {
  return (
    <ol className="space-y-3">
      <Step n={1}>
        Tap the browser menu <Key icon={MdMoreVert}>⋮</Key> at the top right.
      </Step>
      <Step n={2}>
        Tap <Key>Install app</Key> or <Key>Add to Home screen</Key>.
      </Step>
      <Step n={3}>
        Tap <Key>Install</Key>. Open <b>My Workbench</b> from your home screen.
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
    <div className="space-y-3 text-sm text-gray-800">
      <p>
        This page is open inside another app (WhatsApp, Instagram…), which can’t install apps. Open it in{' '}
        <b>{isIOS ? 'Safari' : 'Chrome'}</b> first: tap the <Key>⋮</Key> or <Key>•••</Key> menu and
        choose <Key>Open in browser</Key>.
      </p>
      <Button variant="secondary" className="w-full" onClick={copy}>
        {copied ? <MdCheckCircle className="size-5 text-green-600" /> : <MdContentCopy className="size-5" />}
        {copied ? 'Link copied. Paste it in your browser' : 'Copy link'}
      </Button>
    </div>
  )
}

// Asks the user to install the app, with the right steps for their device.
export default function InstallPrompt() {
  const { mode, open } = useInstall()
  const [busy, setBusy] = useState(false)

  // Open once by itself a few seconds after load, unless dismissed in the last 7 days.
  useEffect(() => {
    if (!AUTO_MODES.includes(mode) || recentlyDismissed()) return
    const timer = setTimeout(installActions.open, AUTO_OPEN_DELAY)
    return () => clearTimeout(timer)
  }, [mode])

  if (mode === 'installed' || mode === 'unsupported') return null

  const install = async () => {
    setBusy(true)
    const outcome = await installActions.prompt()
    setBusy(false)
    if (outcome !== 'accepted') installActions.close(true)
  }

  const manual = mode !== 'prompt'
  const title = mode === 'ios' ? 'Add to your Home Screen' : mode === 'mac-safari' ? 'Add to your Dock' : 'Install My Workbench'

  return (
    <Modal open={open} title={title} subtitle="Free · takes a few seconds" onClose={() => installActions.close(true)}>
      <div className="flex items-center gap-3">
        <motion.img
          src="./pwa-192x192.png"
          alt=""
          className="size-14 rounded-2xl shadow-md ring-1 ring-gray-200"
          initial={{ scale: 0.8, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        />
        <div>
          <p className="font-bold">My Workbench</p>
          <p className="text-xs text-gray-500">Horlicks School Activity</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-sm text-gray-700">
            <Icon className="size-5 shrink-0 text-brand-700" /> {text}
          </li>
        ))}
      </ul>

      {manual && (
        <div className="mt-5 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
          {mode === 'ios' && <IosSteps />}
          {mode === 'android' && <AndroidSteps />}
          {mode === 'inapp' && <InAppSteps />}
          {mode === 'mac-safari' && (
            <p className="text-sm text-gray-800">
              In the menu bar choose <Key>File</Key> → <Key>Add to Dock</Key>, then click <Key>Add</Key>.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => installActions.close(true)}>
          Not now
        </Button>
        {manual ? (
          <Button onClick={() => installActions.close(true)}>Got it</Button>
        ) : (
          <Button onClick={install} loading={busy}>
            Install
          </Button>
        )}
      </div>
    </Modal>
  )
}
