import { Navigate, useParams } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { useVisit, VisitDetail } from '../../features/visits'

export default function VisitSummaryPage() {
  const { id } = useParams()
  const { visit, error } = useVisit(id)

  if (error) return <p className="text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-600" />
  if (visit.status === 'draft') return <Navigate to={`/staff/visits/${id}/photos`} replace />

  return (
    <>
      <PageHeader title="Visit summary" subtitle={visit.schoolName} back="/staff" />
      <VisitDetail visit={visit} />
    </>
  )
}
