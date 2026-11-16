import { useNavigate, useParams } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { useVisit, VisitDetail, VisitStatusBadge } from '../../features/visits'
import { formatDate } from '../../utils/format'

export default function VisitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { visit, error } = useVisit(id)

  if (error) return <p className="text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />

  return (
    <>
      <PageHeader
        title={
          <>
            {visit.schoolName} <VisitStatusBadge status={visit.status} />
          </>
        }
        subtitle={`${visit.cityName} · ${visit.staffName} · ${formatDate(visit.date)}`}
        // Go back in history (keeps the Visits filters); fall back to the list when opened directly.
        back={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/admin/visits'))}
      />
      <VisitDetail visit={visit} admin />
    </>
  )
}
