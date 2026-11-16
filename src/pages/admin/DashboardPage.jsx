import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import PageHeader from '../../components/common/PageHeader'
import { Spinner } from '../../components/ui'
import { CityTable, KpiTiles, VisitsTable } from '../../features/monitoring'
import { getStats } from '../../services/api/visits'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  if (!stats) return <Spinner className="mx-auto mt-10 size-6 text-brand-600" />

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="School activity across Odisha" />
      <KpiTiles stats={stats} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recent visits</h2>
            <Link to="/admin/visits" className="text-sm font-medium text-brand-600">
              View all →
            </Link>
          </div>
          <VisitsTable visits={stats.recent} />
        </div>
        <CityTable rows={stats.byCity} />
      </div>
    </div>
  )
}
