import { useState } from 'react'
import { MdGroups, MdImage, MdStar } from 'react-icons/md'
import { Button, Modal } from '../../../components/ui'
import { formatShortDate } from '../../../utils/format'

const PAGE = 12

// Grid with "View more" (12 at a time) so big campaigns stay fast.
export default function PhotoGallery({ photos }) {
  const [shown, setShown] = useState(PAGE)
  const [viewing, setViewing] = useState(null)
  if (!photos.length) return <p className="py-12 text-center text-sm text-gray-500">No photos shared yet.</p>
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {photos.slice(0, shown).map((p) => (
          <figure key={p.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => p.url && setViewing(p)}
              className="relative block aspect-[4/3] w-full bg-brand-50 text-brand-200"
            >
              {p.url ? (
                <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
              ) : p.type === 'headcount' ? (
                <MdGroups className="absolute inset-0 m-auto size-9" />
              ) : (
                <MdImage className="absolute inset-0 m-auto size-9" />
              )}
              <span className="absolute left-2 top-2 flex gap-1">
                {p.best && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    <MdStar className="size-3.5" /> Best
                  </span>
                )}
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                  {p.type === 'headcount' ? 'Class headcount' : 'Activity'}
                </span>
              </span>
            </button>
            <figcaption className="px-3.5 py-3">
              <p className="truncate text-sm font-semibold">{p.visit.schoolName}</p>
              <p className="text-xs text-gray-500">
                {p.visit.cityName} · {formatShortDate(p.visit.date)}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">
          Showing {Math.min(shown, photos.length).toLocaleString('en-IN')} of {photos.length.toLocaleString('en-IN')} photos · ★ Best first
        </p>
        {shown < photos.length && (
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE * 2)}>
            View more photos ({(photos.length - shown).toLocaleString('en-IN')})
          </Button>
        )}
      </div>
      <Modal open={!!viewing} title={viewing?.visit.schoolName} onClose={() => setViewing(null)} wide>
        {viewing && <img src={viewing.url} alt="" className="max-h-[75dvh] w-full rounded-xl object-contain" />}
      </Modal>
    </>
  )
}
