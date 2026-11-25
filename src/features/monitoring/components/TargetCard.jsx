import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Badge, Card } from '../../../components/ui'
import { formatDate, formatNumber } from '../../../utils/format'
import { STATUS } from '../target'

const BAR = { green: 'bg-brand-700', amber: 'bg-amber-500', red: 'bg-accent-600' }
const pct = (p) => `${Math.round(p.pct * 100)}%`
const perDay = (n) => `${n < 10 ? n.toFixed(1) : formatNumber(Math.round(n))} / day`

function Bar({ p, height = 'h-2', marker }) {
  const tone = STATUS[p.status].tone
  return (
    <div className={`relative ${height} rounded-full bg-brand-100`}>
      <motion.div
        className={`${height} rounded-full ${p.status === 'on-track' || p.status === 'done' ? BAR.green : BAR[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, p.pct * 100)}%` }}
        transition={{ duration: 0.6 }}
      />
      {marker && p.target > 0 && (
        <span
          className="absolute -inset-y-1.5 w-0.5 bg-gray-900"
          style={{ left: `${(p.expected / p.target) * 100}%` }}
          title={`Expected today: ${formatNumber(p.expected)}`}
        />
      )}
    </div>
  )
}

function Stat({ label, value, extra }) {
  return (
    <div className="rounded-xl bg-page px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">
        {value} {extra}
      </p>
    </div>
  )
}

// Campaign target vs achievement: overall + by city. data = campaignProgress(). client = no run-rate columns.
export default function TargetCard({ data, client, editTo }) {
  const o = data.overall
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-bold">{client ? 'Target vs achievement by city' : 'Target vs achievement'}</h2>
          <p className="text-xs text-gray-500">
            Campaign {formatDate(data.start)} – {formatDate(data.end)} · day {o.dayNo} of {o.totalDays} · approved visits
          </p>
        </div>
        {editTo && (
          <Link to={editTo} className="text-sm font-semibold text-brand-700 hover:underline">
            Edit target →
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <p>
          <span className="text-4xl font-bold">{formatNumber(o.done)}</span>
          <span className="ml-2 font-semibold text-gray-500">of {formatNumber(o.target)} visits</span>
        </p>
        <div className="flex items-center gap-3">
          <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
          <span className="text-4xl font-bold text-brand-700">{pct(o)}</span>
        </div>
      </div>
      <div className="mt-4">
        <Bar p={o} height="h-3.5" marker={!client} />
        {!client && <p className="mt-2 text-center text-xs text-gray-500">expected today {formatNumber(o.expected)}</p>}
      </div>

      <div className={`mt-4 grid gap-3 ${client ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {!client && <Stat label="Run-rate" value={perDay(o.runRate)} />}
        {!client && <Stat label="Needed from now" value={perDay(o.needed)} />}
        <Stat
          label="Projected finish"
          value={o.finish ? formatDate(o.finish) : '—'}
          extra={
            o.lateDays > 0 && o.status !== 'done' && <span className="text-xs font-semibold text-accent-600">{o.lateDays} days late</span>
          }
        />
        {client && <Stat label="Visits per day so far" value={formatNumber(Math.round(o.runRate))} />}
        <Stat label="Days left" value={`${o.totalDays - o.dayNo} of ${o.totalDays}`} />
      </div>

      {data.byCity.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold">By city</h3>
          <div className="-mx-5 mt-2 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2.5">City</th>
                  <th className="w-1/3 px-3 py-2.5">Progress</th>
                  <th className="px-3 py-2.5">Visits / target</th>
                  <th className="px-3 py-2.5">%</th>
                  {!client && <th className="px-3 py-2.5">Run-rate</th>}
                  {!client && <th className="px-3 py-2.5">Needed</th>}
                  <th className="px-3 py-2.5">Finish by</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.byCity.map((c) => {
                  const s = STATUS[c.status]
                  const short = c.needed > c.runRate && c.status !== 'done'
                  return (
                    <tr key={c.city}>
                      <td className="px-5 py-2.5 font-semibold">{c.city}</td>
                      <td className="px-3 py-2.5">
                        <Bar p={c} />
                      </td>
                      <td className="px-3 py-2.5">
                        {formatNumber(c.done)} / {formatNumber(c.target)}
                      </td>
                      <td className="px-3 py-2.5 font-bold">{pct(c)}</td>
                      {!client && <td className="px-3 py-2.5">{perDay(c.runRate)}</td>}
                      {!client && <td className={`px-3 py-2.5 ${short ? 'font-bold text-accent-600' : ''}`}>{perDay(c.needed)}</td>}
                      <td className="px-3 py-2.5">{c.finish ? formatDate(c.finish) : '—'}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
