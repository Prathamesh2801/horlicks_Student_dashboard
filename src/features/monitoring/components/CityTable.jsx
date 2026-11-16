import { Card } from '../../../components/ui'
import { formatNumber } from '../../../utils/format'

export default function CityTable({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.students))
  return (
    <Card className="p-0">
      <h2 className="border-b border-gray-100 px-4 py-3 font-semibold">Students counted by city</h2>
      <ul className="divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.cityId} className="px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {r.city} <span className="font-normal text-gray-500">· {r.district}</span>
              </span>
              <span>
                {formatNumber(r.students)} <span className="text-gray-500">/ {r.visits} visits</span>
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.students / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
