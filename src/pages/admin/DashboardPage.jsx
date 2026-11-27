import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { MdCloudOff, MdFlag } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { PeriodFilter, TableToolbar, useTableState } from '../../components/table'
import { Card, EmptyState, Select, Spinner } from '../../components/ui'
import { PERIODS, periodRange } from '../../constants/visit'
import {
  AI_FILTERS,
  Averages,
  CityChart,
  KpiTiles,
  staffOptions,
  TargetCard,
  useCampaign,
  VISIT_FILTERS,
  visitMatches,
  visitStats,
  VisitsTable,
} from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { getCities, listVisits } from '../../services/api/visits.service'
import { formatDate, formatTime } from '../../utils/format'

const FILTERS = { ...VISIT_FILTERS, review: '' }
const periodLabel = ({ period, from, to }) =>
  period === 'custom'
    ? `${from ? formatDate(from) : '…'} – ${to ? formatDate(to) : 'today'}`
    : PERIODS.find((p) => p.value === period)?.label

// Admin home: campaign target + numbers for the chosen filters. Refreshes every minute.
export default function DashboardPage() {
  const [params] = useSearchParams()
  const get = (k) => params.get(k) ?? FILTERS[k]
  const [city, period, from, to] = ['city', 'period', 'from', 'to'].map(get)

  const load = useCallback(() => listVisits({ city, ...periodRange(period, from, to) }), [city, period, from, to])
  const { data, error, loading, refreshing, loadedAt, reload } = useAsync(load)
  const campaign = useCampaign()
  useEffect(() => {
    const timer = setInterval(reload, 60000)
    return () => clearInterval(timer)
  }, [reload])

  const table = useTableState({ rows: data, filters: FILTERS, defaultSort: '', searchText: () => '', matches: visitMatches })
  const [cities, setCities] = useState([])
  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])
  const stats = useMemo(() => table.filtered && visitStats(table.filtered, city ? [city] : cities), [table.filtered, cities, city])
  const staff = useMemo(() => staffOptions(data), [data])
  const label = periodLabel(table.state)

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Dashboard" subtitle={`School activity across all districts${loadedAt ? ` · updated ${formatTime(loadedAt)}` : ''}`} />

      <TableToolbar table={table} hideSearch onRefresh={reload} refreshing={refreshing}>
        <PeriodFilter table={table} />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="District"
          placeholder="All districts"
          value={table.state.city}
          onChange={(e) => table.set({ city: e.target.value })}
          options={cities.map((c) => ({ value: c, label: c }))}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="Ground Team"
          placeholder="All Ground Team"
          value={table.state.staff}
          onChange={(e) => table.set({ staff: e.target.value })}
          options={staff}
        />
        <Select
          className="w-full sm:w-44"
          aria-label="AI count"
          placeholder="All AI results"
          value={table.state.ai}
          onChange={(e) => table.set({ ai: e.target.value })}
          options={AI_FILTERS}
        />
      </TableToolbar>

      {error && !data ? (
        <EmptyState icon={MdCloudOff} title="Couldn’t load the dashboard" text={error} />
      ) : loading || !stats ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <>
          <KpiTiles stats={stats} period={label} />
          {campaign.progress ? (
            <TargetCard data={campaign.progress} editTo="/admin/target" />
          ) : (
            !campaign.loading && (
              <Card className="flex flex-wrap items-center gap-3 p-5">
                <MdFlag className="size-6 text-brand-700" />
                <p className="flex-1 text-sm text-gray-600">
                  No campaign target yet. Set a target for each city to track progress, run-rate and projected finish.
                </p>
                <Link to="/admin/target" className="text-sm font-semibold text-brand-700 hover:underline">
                  Set target →
                </Link>
              </Card>
            )
          )}
          <Averages stats={stats} />
          <CityChart rows={stats.byCity} period={label} />
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-bold">Recent visits</h2>
              <Link to={`/admin/visits?${params}`} className="text-sm font-semibold text-brand-700 hover:underline">
                View all →
              </Link>
            </div>
            {table.filtered.length ? (
              <VisitsTable visits={table.filtered.slice(0, 5)} />
            ) : (
              <p className="px-5 pb-8 text-sm text-gray-500">No visits for these filters.</p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
