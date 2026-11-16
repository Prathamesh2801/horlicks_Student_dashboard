import { motion } from 'framer-motion'
import { Card } from '../../../components/ui'
import { formatCompact, formatNumber } from '../../../utils/format'

// Bar chart of AI headcount per city; the top city is highlighted. Scrolls sideways on phones.
export default function CityChart({ rows, period }) {
  const max = Math.max(1, ...rows.map((r) => r.students))
  return (
    <Card className="p-5">
      <h2 className="font-bold">Students counted by city</h2>
      <p className="text-xs text-gray-500">AI headcount, {period}</p>
      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">No visits in this period yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto pb-1">
          <div className="flex min-w-max">
            {rows.map((r, i) => (
              <div
                key={r.cityId}
                className="flex min-w-16 flex-1 flex-col items-center px-1.5 sm:min-w-20 sm:px-3"
                title={`${r.city}: ${formatNumber(r.students)} students in ${r.visits} visits`}
              >
                <div className="flex h-56 w-full flex-col items-center justify-end border-b border-gray-200">
                  <span className={`mb-1 text-xs font-bold ${i === 0 ? 'text-brand-700' : 'text-gray-700'}`}>{formatCompact(r.students)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (r.students / max) * 85)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className={`w-full max-w-14 rounded-t-md ${i === 0 ? 'bg-brand-700' : 'bg-brand-200'}`}
                  />
                </div>
                <span className="mt-2 max-w-full truncate text-xs text-gray-600">{r.city}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
