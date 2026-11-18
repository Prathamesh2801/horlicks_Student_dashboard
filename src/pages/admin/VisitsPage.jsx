import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdDownload } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, RefreshBar, StaleBanner, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Button, Card, Select } from '../../components/ui'
import { PERIODS, periodRange } from '../../constants/visit'
import { VISIT_SORT, VisitsTable } from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { getCities, listVisits } from '../../services/api/visits.service'
import { downloadCsv } from '../../utils/downloadCsv'
import { formatNumber, formatTime, todayISO } from '../../utils/format'

const FILTERS = { city: '', period: 'this', ai: '' }

const AI_FILTERS = [
  { value: 'counted', label: 'AI counted' },
  { value: 'failed', label: 'AI count failed' },
  { value: 'none', label: 'No AI photos' },
]
const aiState = (v) => (v.aiFailed ? 'failed' : v.photos.some((p) => p.type === 'headcount') ? 'counted' : 'none')

// Phones have no column headers, so sorting is a menu there.
const SORT_OPTIONS = [
  { value: '-date', label: 'Newest first' },
  { value: 'date', label: 'Oldest first' },
  { value: '-count', label: 'Most students' },
  { value: 'school', label: 'School A–Z' },
  { value: 'city', label: 'City A–Z' },
  { value: 'staff', label: 'Staff A–Z' },
]

function exportCsv(visits) {
  downloadCsv(`visits-${todayISO()}.csv`, [
    ['Visit ID', 'Date', 'School', 'City', 'Staff', 'Photos', 'Unique students', 'Faces (incl. repeats)', 'AI photos failed', 'Latitude', 'Longitude', 'Uploaded'],
    ...visits.map((v) => [v.id, v.date, v.schoolName, v.cityName, v.staffName, v.photoCount, v.headcount, v.facesSeen, v.aiFailed, v.lat, v.lng, v.submittedAt]),
  ])
}

// City + period are filtered by the server; search, AI filter, sorting and paging happen here.
// Everything is kept in the URL, so Back from a visit returns to the same view.
export default function VisitsPage() {
  const [params] = useSearchParams()
  const city = params.get('city') ?? FILTERS.city
  const period = params.get('period') ?? FILTERS.period

  const load = useCallback(() => listVisits({ city, ...periodRange(period) }), [city, period])
  const { data, error, loading, refreshing, loadedAt, reload } = useAsync(load)

  const table = useTableState({
    rows: data,
    filters: FILTERS,
    defaultSort: '-date',
    sortValue: VISIT_SORT,
    searchText: (v) => `${v.schoolName} ${v.staffName} ${v.cityName}`,
    matches: (v, s) => !s.ai || aiState(v) === s.ai,
  })

  const [cities, setCities] = useState([])
  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visits"
        subtitle={
          loading ? 'Loading…' : `${formatNumber(table.total)} visit${table.total === 1 ? '' : 's'}${loadedAt ? ` · updated ${formatTime(loadedAt)}` : ''} · click a row to open it`
        }
        action={
          <Button variant="secondary" onClick={() => exportCsv(table.filtered)} disabled={!table.total}>
            <MdDownload className="size-5" /> Export
          </Button>
        }
      />

      <TableToolbar table={table} placeholder="Search school, staff or city" onRefresh={reload} refreshing={refreshing} sortOptions={SORT_OPTIONS}>
        <Select
          className="w-full sm:w-44"
          aria-label="City"
          placeholder="All cities"
          value={table.state.city}
          onChange={(e) => table.set({ city: e.target.value })}
          options={cities.map((c) => ({ value: c, label: c }))}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="Period"
          value={table.state.period}
          onChange={(e) => table.set({ period: e.target.value })}
          options={PERIODS}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-44"
          aria-label="AI count"
          placeholder="All AI results"
          value={table.state.ai}
          onChange={(e) => table.set({ ai: e.target.value })}
          options={AI_FILTERS}
        />
      </TableToolbar>

      {error && data && <StaleBanner message={error} onRetry={reload} />}

      {error && !data ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
        <Card className="overflow-hidden">
          <RefreshBar active={refreshing && !loading} />
          {loading ? (
            <TableSkeleton />
          ) : table.total === 0 ? (
            <NoResults
              onClear={table.isFiltered ? table.reset : undefined}
              text={table.isFiltered ? undefined : 'No visits in this period yet.'}
            />
          ) : (
            <div className={`transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
              <VisitsTable visits={table.rows} table={table} />
              <Pagination table={table} noun="visits" />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
