import { motion } from 'framer-motion'
import { MdDelete, MdGroups, MdImage } from 'react-icons/md'
import { Badge, Spinner } from '../../../components/ui'
import { PHOTO_TYPE_LABEL } from '../../../constants/visit'

function AiChip({ ai }) {
  if (!ai) return null
  if (ai.status === 'processing' || ai.status === 'pending')
    return (
      <Badge tone="amber">
        <Spinner className="size-3" /> Counting…
      </Badge>
    )
  if (ai.status === 'failed') return <Badge tone="red">AI failed</Badge>
  return (
    <Badge tone="green">
      <MdGroups /> {ai.count}
    </Badge>
  )
}

// editable = staff before submit: tick photos for headcount, delete photos.
export default function PhotoGrid({ photos, editable, onToggle, onDelete }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <motion.div
          key={p.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${p.needsHeadcount ? 'ring-brand-500' : 'ring-gray-200'}`}
        >
          <div className="relative aspect-[4/3] bg-gray-100">
            {p.url ? (
              <img src={p.url} alt={`${PHOTO_TYPE_LABEL[p.type]} photo`} className="size-full object-cover" />
            ) : (
              <MdImage className="absolute inset-0 m-auto size-10 text-gray-300" />
            )}
            <div className="absolute left-2 top-2 flex gap-1">
              <Badge className="bg-white/90">{PHOTO_TYPE_LABEL[p.type]}</Badge>
              <AiChip ai={p.ai} />
            </div>
            {editable && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow"
                aria-label="Delete photo"
              >
                <MdDelete className="size-4" />
              </button>
            )}
          </div>
          {editable && (
            <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={p.needsHeadcount}
                onChange={() => onToggle(p)}
                className="size-4 accent-brand-600"
              />
              Count heads
            </label>
          )}
        </motion.div>
      ))}
    </div>
  )
}
