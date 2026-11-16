import { useEffect, useState } from 'react'
import { MdSearchOff } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { Filters, VisitsTable } from '../../features/monitoring'
import { getCities } from '../../services/api/cities'
import { listVisits } from '../../services/api/visits'

export default function VisitsPage() {
  const [filters, setFilters] = useState({ q: '', cityId: '', status: '' })
  const [cities, setCities] = useState([])
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    getCities().then(setCities)
  }, [])

  useEffect(() => {
    let current = true
    listVisits(filters).then((v) => current && setVisits(v))
    return () => {
      current = false
    }
  }, [filters])

  return (
    <div className="space-y-4">
      <PageHeader title="Visits" subtitle={visits ? `${visits.length} visits` : ' '} />
      <Filters value={filters} onChange={setFilters} cities={cities} />
      {!visits ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-600" />
      ) : visits.length === 0 ? (
        <EmptyState icon={MdSearchOff} title="No visits match these filters" />
      ) : (
        <VisitsTable visits={visits} />
      )}
    </div>
  )
}
