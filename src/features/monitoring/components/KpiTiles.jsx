import { MdCheck, MdGroups, MdLocationCity, MdSchool } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { formatNumber } from '../../../utils/format'

// Top numbers from visitStats(). client = wording for the client view (+ % of target).
export default function KpiTiles({ stats, period, client, targetPct }) {
  const tiles = [
    {
      label: client ? 'Students reached' : 'Unique students (AI)',
      sub: client ? 'unique, AI counted' : `${formatNumber(stats.facesSeen)} faces incl. repeats`,
      value: formatNumber(stats.students),
      icon: MdGroups,
      tone: 'bg-brand-100 text-brand-700',
    },
    { label: 'Schools covered', sub: period, value: formatNumber(stats.schools), icon: MdSchool, tone: 'bg-accent-50 text-accent-600' },
    {
      label: 'Visits completed',
      sub: client ? 'approved' : period,
      value: formatNumber(stats.visits),
      icon: MdCheck,
      tone: 'bg-green-50 text-green-600',
    },
    client
      ? {
          label: '% of target',
          sub: 'approved visits',
          value: targetPct == null ? '—' : `${Math.round(targetPct * 100)}%`,
          icon: MdLocationCity,
          tone: 'bg-amber-50 text-amber-600',
        }
      : {
          label: 'Cities with visits',
          sub: `of ${formatNumber(stats.cityCount)} cities`,
          value: formatNumber(stats.activeCities),
          icon: MdLocationCity,
          tone: 'bg-amber-50 text-amber-600',
        },
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
          <p className="mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
        </Card>
      ))}
    </div>
  )
}

// Average students per visit and per school.
export function Averages({ stats }) {
  const one = (label, value, note) => (
    <Card className="p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value == null ? '—' : value.toFixed(1)}</p>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </Card>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {one(
        'Avg students per visit',
        stats.perVisit,
        `${formatNumber(stats.students)} unique students ÷ ${formatNumber(stats.visits)} visits`,
      )}
      {one(
        'Avg students per school',
        stats.perSchool,
        `${formatNumber(stats.students)} unique students ÷ ${formatNumber(stats.schools)} schools covered`,
      )}
    </div>
  )
}
