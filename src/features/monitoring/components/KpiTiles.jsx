import { MdCheck, MdGroups, MdHistory, MdLocationCity } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { formatNumber } from '../../../utils/format'

// Numbers from Admin/dashboard.php for the selected month.
export default function KpiTiles({ stats }) {
  const tiles = [
    {
      label: 'Unique students (AI)',
      sub: `${formatNumber(stats.facesSeen)} faces incl. repeats`,
      value: stats.students ?? stats.facesSeen,
      icon: MdGroups,
      tone: 'bg-brand-100 text-brand-700',
    },
    { label: 'Visits completed', sub: 'this month', value: stats.visits, icon: MdCheck, tone: 'bg-green-50 text-green-600' },
    {
      label: 'Cities with visits',
      sub: `of ${formatNumber(stats.byCity.length)} cities`,
      value: stats.activeCities,
      icon: MdLocationCity,
      tone: 'bg-accent-50 text-accent-600',
    },
    { label: 'Visits all time', sub: 'all months', value: stats.allTimeVisits, icon: MdHistory, tone: 'bg-amber-50 text-amber-600' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {tiles.map(({ label, sub, subTone = 'text-green-600', value, icon: Icon, tone }) => (
        <Card key={label} className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700">{label}</p>
              {sub && <p className={`text-xs font-semibold ${subTone}`}>{sub}</p>}
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold sm:text-3xl">{formatNumber(value)}</p>
        </Card>
      ))}
    </div>
  )
}
