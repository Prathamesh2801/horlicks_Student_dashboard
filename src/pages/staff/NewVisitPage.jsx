import { useState } from 'react'
import { useNavigate } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { Card } from '../../components/ui'
import { VisitDetailsForm } from '../../features/visits'
import { createVisit } from '../../services/api/visits'

export default function NewVisitPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (details) => {
    setSubmitting(true)
    setError(null)
    try {
      const visit = await createVisit(details)
      navigate(`/staff/visits/${visit.id}/photos`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="New visit" subtitle="Step 1 of 2 · Visit details" back="/staff" />
      <Card>
        <VisitDetailsForm onSubmit={handleSubmit} submitting={submitting} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>
    </>
  )
}
