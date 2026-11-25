import { motion } from 'framer-motion'
import { Card } from '../../../components/ui'
import { formatNumber, formatShortDate } from '../../../utils/format'
import { weeklyStudents } from '../stats'

// Unique students reached per week (bars). The current week is lighter (still in progress).
export default function TrendChart({ visits, title = 'Students reached over time', note = 'Per week · approved visits' }) {
  const weeks = weeklyStudents(visits)
  const max = Math.max(1, ...weeks.map((w) => w.students))
  const thisWeek = weeklyStudents([{ date: new Date().toLocaleDateString('en-CA'), headcount: 0 }])[0].week
  return (
    <Card className="p-5">
      <h2 className="font-bold">{title}</h2>
      <p className="text-xs text-gray-500">{note}</p>
      {!weeks.length ? (
        <p className="py-16 text-center text-sm text-gray-500">No visits in this period yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto pb-1">
          <div className="flex min-w-max items-end">
            {weeks.map((w, i) => (
              <div
                key={w.week}
                className="flex min-w-16 flex-1 flex-col items-center px-1.5 sm:px-3"
                title={`Week of ${formatShortDate(w.week)}: ${formatNumber(w.students)} students`}
              >
                <div className="flex h-48 w-full flex-col items-center justify-end border-b border-gray-200">
                  <span className="mb-1 text-xs font-bold text-gray-700">{formatNumber(w.students)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (w.students / max) * 85)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className={`w-full max-w-16 rounded-t-md ${w.week === thisWeek ? 'bg-brand-200' : 'bg-brand-700'}`}
                  />
                </div>
                <span className="mt-2 text-xs text-gray-600">{formatShortDate(w.week)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
