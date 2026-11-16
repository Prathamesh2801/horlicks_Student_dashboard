import { useParams } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { useVisit, VisitDetail } from '../../features/visits'

export default function VisitDetailPage() {
  const { id } = useParams()
  const { visit, error } = useVisit(id)

  if (error) return <p className="text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-600" />

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={visit.schoolName} subtitle={`${visit.cityName} · ${visit.staffName}`} back="/admin/visits" />
      <VisitDetail visit={visit} showStaff />
    </div>
  )
}
