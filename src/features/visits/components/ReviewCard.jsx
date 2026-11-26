import { useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { Badge, Button, Card } from '../../../components/ui'
import { REVIEW } from '../../../constants/visit'
import { reviewVisit } from '../../../services/api/visits.service'
import { formatDateTime } from '../../../utils/format'

// Admin: approve or reject a visit. Approved visits (with their headcount photos and the normal photos set to
// "Show") are what the client sees.
export default function ReviewCard({ visit }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const r = REVIEW[visit.review]
  const set = async (status) => {
    setBusy(status)
    setError(null)
    try {
      await reviewVisit(visit.id, status)
    } catch (err) {
      setError(err.message)
    }
    setBusy(null)
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">Review</h2>
        <Badge tone={r.tone}>{r.label}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {visit.review === 'approved'
          ? 'The client can see this visit, its headcount photos and the normal photos set to “Show”.'
          : 'Approve to show this visit to the client. Its headcount photos and the normal photos set to “Show” go with it.'}
      </p>
      {visit.reviewedBy && (
        <p className="mt-1 text-xs text-gray-500">
          Set by {visit.reviewedBy} · {formatDateTime(visit.reviewedAt)}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => set('approved')} loading={busy === 'approved'} disabled={visit.review === 'approved'}>
          <MdCheck className="size-5" /> Approve
        </Button>
        <Button
          variant="secondary"
          onClick={() => set(visit.review === 'rejected' ? 'waiting' : 'rejected')}
          loading={busy === 'rejected' || busy === 'waiting'}
          className="!text-accent-600"
        >
          <MdClose className="size-5" /> {visit.review === 'rejected' ? 'Undo reject' : 'Reject'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Card>
  )
}
