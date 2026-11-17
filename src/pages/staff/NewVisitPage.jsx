import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../../components/common/TopBar'
import { useAuth } from '../../features/auth'
import { VisitDetailsForm } from '../../features/visits'
import { createDraft } from '../../services/drafts/draftStore'

function Steps() {
  return (
    <ol className="mb-4 flex items-center gap-3 text-sm" aria-label="Progress">
      <li className="flex items-center gap-2 font-semibold text-brand-700" aria-current="step">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-700 text-xs text-white">1</span> Details
      </li>
      <li className="h-px flex-1 bg-gray-300" aria-hidden="true" />
      <li className="flex items-center gap-2 text-gray-500">
        <span className="flex size-6 items-center justify-center rounded-full text-xs ring-1 ring-gray-300">2</span> Photos
      </li>
    </ol>
  )
}

// Step 1: details. The visit is saved as a draft on the phone (works offline) and uploaded after the photos.
export default function NewVisitPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (details) => {
    setSubmitting(true)
    setError(null)
    try {
      const draft = await createDraft({ user, ...details })
      navigate(`/staff/drafts/${draft.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar title="New visit" subtitle="Step 1 of 2 · Visit details" back="/staff" />
      <Steps />
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <VisitDetailsForm onSubmit={handleSubmit} submitting={submitting} />
    </>
  )
}
