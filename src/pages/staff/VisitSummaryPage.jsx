import { Link, Navigate, useParams } from 'react-router'
import TopBar from '../../components/common/TopBar'
import { Spinner } from '../../components/ui'
import { useVisit, VisitDetail } from '../../features/visits'

export default function VisitSummaryPage() {
  const { id } = useParams()
  const { visit, error } = useVisit(id)

  if (error) return <p className="pt-6 text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  if (visit.status === 'draft') return <Navigate to={`/staff/visits/${id}/photos`} replace />

  return (
    <>
      <TopBar title="Visit summary" subtitle={visit.schoolName} back="/staff" />
      <VisitDetail visit={visit} />
      <Link
        to="/staff"
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-brand-700 ring-1 ring-gray-300 hover:bg-brand-50"
      >
        Back to my visits
      </Link>
    </>
  )
}
