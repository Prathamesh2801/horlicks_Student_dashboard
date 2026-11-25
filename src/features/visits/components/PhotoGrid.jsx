import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdAdd, MdDelete, MdGroups, MdImage, MdStar, MdStarBorder } from 'react-icons/md'
import { Modal, Spinner } from '../../../components/ui'
import { setPhotoFlags } from '../../../services/api/pending.service'

// Placeholder tints for photos without a link, as in the design.
const TINTS = ['bg-amber-100 text-amber-300', 'bg-blue-100 text-blue-300', 'bg-green-100 text-green-300']
const HEAD_TINT = 'bg-[#ead9cb] text-[#c4a58c]'

function AiPill({ photo, editable }) {
  if (photo.type !== 'headcount') return null
  const { ai } = photo
  let text
  if (!ai) text = editable ? 'AI counts after submit' : 'Not counted'
  else if (ai.status === 'done') text = `${ai.count} faces`
  else if (ai.status === 'failed') text = 'AI failed'
  else
    text = (
      <>
        <Spinner className="size-3" /> Counting…
      </>
    )
  return (
    <span className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
      {text}
    </span>
  )
}

// Admin controls under a normal photo: "Show" to the client, ★ Best (first in the client gallery and reports).
function Flags({ photo }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          role="switch"
          checked={photo.show}
          onChange={(e) => setPhotoFlags(photo.id, e.target.checked ? { show: true } : { show: false, best: false })}
          className="peer sr-only"
        />
        <span className="relative h-4 w-7 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-white after:transition peer-checked:bg-green-600 peer-checked:after:translate-x-3 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500" />
        <span className={photo.show ? 'text-green-700' : 'text-gray-500'}>{photo.show ? 'Show' : 'Hidden'}</span>
      </label>
      <button
        type="button"
        onClick={() => setPhotoFlags(photo.id, photo.best ? { best: false } : { best: true, show: true })}
        className={`rounded p-0.5 ${photo.best ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
        aria-pressed={photo.best}
        aria-label="Best photo"
        title={photo.best ? 'Best photo (shown first to the client)' : 'Mark as best photo'}
      >
        {photo.best ? <MdStar className="size-5" /> : <MdStarBorder className="size-5" />}
      </button>
    </div>
  )
}

// editable = staff before submit (delete + add tiles). pending = photos still uploading.
// flags = admin: Show / ★ Best controls under each photo.
export default function PhotoGrid({ photos, editable, onDelete, onAdd, pending = 0, label, flags, className = 'grid-cols-2 sm:grid-cols-3' }) {
  const [viewing, setViewing] = useState(null)

  return (
    <>
      <div className={`grid gap-3 ${className}`}>
        {photos.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200"
          >
            <div className={`relative aspect-[4/3] ${flags && !p.show ? 'opacity-45' : ''} ${p.url ? 'bg-gray-100' : p.type === 'headcount' ? HEAD_TINT : TINTS[i % TINTS.length]}`}>
              {p.url ? (
                <button type="button" onClick={() => setViewing(p)} className="size-full" aria-label="View photo">
                  <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ) : p.type === 'headcount' ? (
                <MdGroups className="absolute inset-0 m-auto size-8" />
              ) : (
                <MdImage className="absolute inset-0 m-auto size-7" />
              )}
              {editable && (
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-accent-600 shadow hover:bg-accent-50"
                  aria-label="Delete photo"
                >
                  <MdDelete className="size-4" />
                </button>
              )}
              <AiPill photo={p} editable={editable} />
              {flags && p.best && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  <MdStar className="size-3.5" /> Best
                </span>
              )}
            </div>
            {flags ? <Flags photo={p} /> : label && <p className="px-3 py-2 text-xs font-semibold text-gray-800">{label}</p>}
          </motion.div>
        ))}

        {Array.from({ length: pending }, (_, i) => (
          <div key={`pending-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 ring-1 ring-gray-200">
            <Spinner className="size-6 text-brand-700" />
          </div>
        ))}

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <MdAdd className="size-6" /> Add photo
          </button>
        )}
      </div>

      <Modal open={!!viewing} title="Photo" onClose={() => setViewing(null)} wide>
        {viewing && <img src={viewing.url} alt="" className="max-h-[75dvh] w-full rounded-xl object-contain" />}
      </Modal>
    </>
  )
}
