import { useState } from 'react'
import { MdCheck, MdClose } from 'react-icons/md'
import { Badge, Button, Card } from '../../../components/ui'
import { AUDIT } from '../../../constants/visit'
import { saveAudit } from '../../../services/api/visits.service'
import { formatDateTime } from '../../../utils/format'

// Audit of one visit: Approved / Rejected + remark (a remark is required to reject).
// Shown to Admin, Client and Auditors (never to the Ground Team). canEdit = Auditor: can change it any time.
export default function AuditCard({ visit, canEdit }) {
  const audit = visit.audit
  const [status, setStatus] = useState(null) // picked, not saved yet
  const [remark, setRemark] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const pick = status ?? audit?.status ?? null
  const text = remark ?? audit?.remark ?? ''
  const changed = pick !== (audit?.status ?? null) || text.trim() !== (audit?.remark ?? '')
  const needsRemark = pick === 'rejected' && text.trim().length < 3

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await saveAudit(visit.id, pick, text.trim())
      setStatus(null)
      setRemark(null)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">Audit</h2>
        <Badge tone={AUDIT[audit?.status ?? 'none'].tone}>{AUDIT[audit?.status ?? 'none'].label}</Badge>
      </div>
      {audit && (
        <div className="text-sm">
          {audit.remark && <p className="whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-gray-800">{audit.remark}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {audit.by ? `by ${audit.by}` : ''}
            {audit.at ? ` · ${formatDateTime(audit.at)}` : ''}
          </p>
        </div>
      )}
      {!audit && !canEdit && <p className="text-sm text-gray-500">Not audited yet.</p>}

      {canEdit && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['approved', 'Approve', MdCheck, 'bg-green-600 ring-green-600'],
              ['rejected', 'Reject', MdClose, 'bg-red-600 ring-red-600'],
            ].map(([value, label, Icon, on]) => (
              <button
                key={value}
                type="button"
                aria-pressed={pick === value}
                onClick={() => setStatus(value)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${pick === value ? `${on} text-white` : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'}`}
              >
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-800">
              Remark {pick === 'rejected' ? '(required)' : '(optional)'}
            </span>
            <textarea
              value={text}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={pick === 'rejected' ? 'Why is it rejected? e.g. Photos don’t match the school' : 'Any note for this visit'}
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button className="w-full" onClick={save} loading={saving} disabled={!pick || !changed || needsRemark}>
            {audit ? 'Update audit' : 'Submit audit'}
          </Button>
          {needsRemark && <p className="text-xs text-accent-600">Write a short remark to reject.</p>}
          {audit && <p className="text-xs text-gray-500">You can change this audit at any time.</p>}
        </div>
      )}
    </Card>
  )
}
