import { MdGroups } from 'react-icons/md'
import { Card, Spinner } from '../../../components/ui'
import { formatNumber } from '../../../utils/format'

export default function HeadcountSummary({ visit }) {
  const counted = visit.photos.filter((p) => p.needsHeadcount)
  return (
    <Card className="flex items-center gap-4">
      <div className="flex size-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {visit.status === 'processing' ? <Spinner className="size-6" /> : <MdGroups className="size-8" />}
      </div>
      <div>
        <p className="text-sm text-gray-500">Students counted (AI)</p>
        <p className="text-3xl font-semibold">
          {visit.status === 'processing' ? 'Counting…' : formatNumber(visit.headcount)}
        </p>
        <p className="text-xs text-gray-500">
          {visit.status === 'draft'
            ? 'Counted after the visit is submitted'
            : `Highest count across ${counted.length} headcount photo${counted.length === 1 ? '' : 's'}`}
        </p>
      </div>
    </Card>
  )
}
