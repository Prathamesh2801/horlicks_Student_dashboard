import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { PIN_COLOR } from '../../constants/visit'
import { VisitsMap } from '../../features/monitoring'
import { listVisits } from '../../services/api/visits.service'

const LEGEND = [
  [PIN_COLOR.counted, 'AI counted'],
  [PIN_COLOR.aiFailed, 'AI count failed'],
]

export default function MapPage() {
  const [visits, setVisits] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listVisits().then(setVisits, (e) => setError(e.message))
  }, [])

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-4rem)]">
      <PageHeader
        title="Map"
        subtitle="Visit locations captured by staff"
        action={
          <div className="flex flex-wrap gap-x-4 gap-y-1 self-center text-xs text-gray-700">
            {LEGEND.map(([color, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: color }} /> {label}
              </span>
            ))}
          </div>
        }
      />
      <div className="min-h-[420px] flex-1 rounded-2xl ring-1 ring-gray-200">
        {error ? (
          <EmptyState title="Couldn’t load visits" text={error} />
        ) : visits ? (
          <VisitsMap visits={visits} />
        ) : (
          <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
        )}
      </div>
    </div>
  )
}
