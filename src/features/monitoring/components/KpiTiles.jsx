import { MdCheck, MdGroups, MdHourglassTop, MdSchool } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { config } from '../../../config/config'
import { formatNumber } from '../../../utils/format'

export default function KpiTiles({ stats }) {
  const coverage = Math.round((stats.schools / config.totalSchools) * 1000) / 10
  const tiles = [
    {
      label: 'Students counted (AI)',
      sub: `+${formatNumber(stats.studentsThisWeek)} this week`,
      value: stats.students,
      icon: MdGroups,
      tone: 'bg-brand-100 text-brand-700',
    },
    {
      label: 'Schools covered',
      sub: `${coverage}% of ${formatNumber(config.totalSchools)}`,
      value: stats.schools,
      icon: MdSchool,
      tone: 'bg-accent-50 text-accent-600',
    },
    { label: 'Visits completed', value: stats.completed, icon: MdCheck, tone: 'bg-green-50 text-green-600' },
    { label: 'AI counting', value: stats.processing, icon: MdHourglassTop, tone: 'bg-amber-50 text-amber-600' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {tiles.map(({ label, sub, value, icon: Icon, tone }) => (
        <Card key={label} className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700">{label}</p>
              {sub && <p className="text-xs font-semibold text-green-600">{sub}</p>}
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold sm:text-3xl">{formatNumber(value)}</p>
        </Card>
      ))}
    </div>
  )
}
