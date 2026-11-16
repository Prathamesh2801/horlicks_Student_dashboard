import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { STATUS_COLOR, VISIT_STATUS } from '../../constants/visit'
import { VisitsMap } from '../../features/monitoring'
import { listVisits } from '../../services/api/visits'

const LEGEND = ['completed', 'processing', 'draft']

export default function MapPage() {
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    listVisits().then(setVisits)
  }, [])

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-4rem)]">
      <PageHeader
        title="Map"
        subtitle="Visit locations captured by staff"
        action={
          <div className="flex flex-wrap gap-x-4 gap-y-1 self-center text-xs text-gray-700">
            {LEGEND.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[s] }} /> {VISIT_STATUS[s].label}
              </span>
            ))}
          </div>
        }
      />
      <div className="min-h-[420px] flex-1 rounded-2xl ring-1 ring-gray-200">
        {visits ? <VisitsMap visits={visits} /> : <Spinner className="mx-auto mt-10 size-6 text-brand-700" />}
      </div>
    </div>
  )
}
