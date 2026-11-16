import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MdAdd, MdAssignment } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { VisitCard } from '../../features/visits'
import { listVisits } from '../../services/api/visits'

export default function MyVisitsPage() {
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    listVisits({ mine: 1 }).then(setVisits)
  }, [])

  const newVisit = (
    <Link
      to="/staff/visits/new"
      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
    >
      <MdAdd className="size-5" /> New visit
    </Link>
  )

  return (
    <>
      <PageHeader title="My visits" subtitle="Your school activity visits" action={newVisit} />
      {!visits ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-600" />
      ) : visits.length === 0 ? (
        <EmptyState icon={MdAssignment} title="No visits yet" text="Start a visit when you reach a school." action={newVisit} />
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <VisitCard key={v.id} visit={v} to={v.status === 'draft' ? `/staff/visits/${v.id}/photos` : `/staff/visits/${v.id}`} />
          ))}
        </div>
      )}
    </>
  )
}
