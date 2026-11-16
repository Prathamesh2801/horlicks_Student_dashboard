import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { VisitsMap } from '../../features/monitoring'
import { listVisits } from '../../services/api/visits'

const LEGEND = [
  ['Completed', 'bg-green-600'],
  ['AI counting', 'bg-amber-500'],
  ['Draft', 'bg-gray-400'],
]

export default function MapPage() {
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    listVisits().then(setVisits)
  }, [])

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <PageHeader
        title="Map"
        subtitle="Visit locations captured by staff"
        action={
          <div className="hidden gap-3 text-xs text-gray-600 sm:flex">
            {LEGEND.map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1">
                <span className={`size-2.5 rounded-full ${color}`} /> {label}
              </span>
            ))}
          </div>
        }
      />
      <div className="flex-1">{visits ? <VisitsMap visits={visits} /> : <Spinner className="mx-auto mt-10 size-6 text-brand-600" />}</div>
    </div>
  )
}
