import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { MdCloudOff } from 'react-icons/md'
import { Card, EmptyState, fieldClass, Spinner } from '../../components/ui'
import { CityChart, KpiTiles, VisitsTable } from '../../features/monitoring'
import { getStats } from '../../services/api/visits.service'
import { formatMonth, formatTime, monthISO } from '../../utils/format'

export default function DashboardPage() {
  const [month, setMonth] = useState(monthISO())
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  // Live totals: refresh every 30 s.
  useEffect(() => {
    let live = true
    const load = () =>
      getStats({ month }).then(
        (s) => {
          if (!live) return
          setStats({ ...s, loadedAt: new Date().toISOString() })
          setError(null)
        },
        (e) => live && setError(e.message),
      )
    load()
    const timer = setInterval(load, 30000)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [month])

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`School activity across all cities${stats ? ` · updated ${formatTime(stats.loadedAt)}` : ''}`}
        action={
          <input
            type="month"
            aria-label="Month"
            value={month}
            max={monthISO()}
            onChange={(e) => setMonth(e.target.value)}
            className={`${fieldClass.replace('w-full', 'w-48')} font-semibold`}
          />
        }
      />
      {error && !stats ? (
        <EmptyState icon={MdCloudOff} title="Couldn’t load the dashboard" text={error} />
      ) : !stats ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <>
          <KpiTiles stats={stats} />
          <CityChart rows={stats.byCity} period={month ? formatMonth(month) : 'all time'} />
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-bold">Recent visits</h2>
              <Link to="/admin/visits" className="text-sm font-semibold text-brand-700 hover:underline">
                View all →
              </Link>
            </div>
            {stats.recent.length ? (
              <VisitsTable visits={stats.recent} />
            ) : (
              <p className="px-5 pb-8 text-sm text-gray-500">No visits in this period yet.</p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
