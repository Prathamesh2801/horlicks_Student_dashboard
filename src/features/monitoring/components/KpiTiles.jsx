import { MdCheckCircle, MdGroups, MdHourglassTop, MdPhotoLibrary, MdSchool } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { formatNumber } from '../../../utils/format'

export default function KpiTiles({ stats }) {
  const tiles = [
    { label: 'Students counted (AI)', value: stats.students, icon: MdGroups, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Schools covered', value: stats.schools, icon: MdSchool, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Visits completed', value: stats.completed, icon: MdCheckCircle, tone: 'bg-green-50 text-green-600' },
    { label: 'AI counting', value: stats.processing, icon: MdHourglassTop, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Photos uploaded', value: stats.photos, icon: MdPhotoLibrary, tone: 'bg-gray-100 text-gray-600' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label} className="flex items-center gap-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold">{formatNumber(value)}</p>
            <p className="truncate text-xs text-gray-500">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
