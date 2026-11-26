import { useState } from 'react'
import { MdEdit } from 'react-icons/md'
import { Button, Card, Input } from '../../../components/ui'
import { correctCount, getCountHistory } from '../../../services/api/visits.service'
import { formatDateTime, formatNumber } from '../../../utils/format'

// Admin: correct the unique student count when the AI missed people (server Admin/visit_count.php).
// Every change is kept with who, when and why; the AI won't overwrite it ("Count again" does).
export default function CountCorrection({ visit }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState('')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const show = async () => {
    setOpen(true)
    setCount(visit.headcount == null ? '' : String(visit.headcount))
    setReason('')
    setError(null)
    setHistory(await getCountHistory(visit.id).catch(() => []))
  }
  const valid = count !== '' && Number(count) !== visit.headcount
  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await correctCount(visit.id, count, reason.trim())
      setOpen(false)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  if (!open)
    return (
      <button type="button" onClick={show} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <MdEdit className="size-4" /> Correct the student count
      </button>
    )

  return (
    <Card className="space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Input
          label="Unique students"
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value.replace(/\D/g, '').slice(0, 6))}
          hint={visit.headcount != null ? `AI / current: ${formatNumber(visit.headcount)}` : undefined}
        />
        <Input
          label="Reason (optional)"
          placeholder="e.g. AI missed children in the back rows"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving} disabled={!valid}>
          Save count
        </Button>
      </div>
      {history?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Changes</p>
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={h.id} className="text-gray-700">
                {h.from == null ? '—' : formatNumber(h.from)} → <b>{formatNumber(h.to)}</b>
                <span className="text-gray-500">
                  {' '}
                  · {h.by} · {formatDateTime(h.at)}
                  {h.reason && ` · ${h.reason}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
