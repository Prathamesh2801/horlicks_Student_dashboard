import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdDoneAll } from 'react-icons/md'
import ExportMenu from '../../components/common/ExportMenu'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, PeriodFilter, RefreshBar, StaleBanner, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Button, Card, Select } from '../../components/ui'
import { periodRange, REVIEW, REVIEW_FILTERS } from '../../constants/visit'
import { AI_FILTERS, staffOptions, VISIT_FILTERS, VISIT_SORT, visitMatches, VisitsTable } from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { setReviews } from '../../services/api/pending.service'
import { getCities, listVisits } from '../../services/api/visits.service'
import { formatNumber, formatTime, todayISO } from '../../utils/format'

// Phones have no column headers, so sorting is a menu there.
const SORT_OPTIONS = [
  { value: '-date', label: 'Newest first' },
  { value: 'date', label: 'Oldest first' },
  { value: '-count', label: 'Most students' },
  { value: 'school', label: 'School A–Z' },
  { value: 'city', label: 'City A–Z' },
  { value: 'staff', label: 'Ground Team A–Z' },
  { value: 'review', label: 'Review status' },
]

const exportRows = (visits) => [
  ['Visit ID', 'Date', 'School', 'City', 'Ground Team', 'POC name', 'POC contact', 'Review', 'Photos', 'Unique students', 'Faces (incl. repeats)', 'AI photos failed', 'Latitude', 'Longitude', 'Uploaded'],
  ...visits.map((v) => [
    v.id, v.date, v.schoolName, v.cityName, v.staffName, v.pocName, v.pocContact, REVIEW[v.review]?.label,
    v.photoCount, v.headcount, v.facesSeen, v.aiFailed, v.lat, v.lng, v.submittedAt,
  ]),
]

// City + period are filtered by the server; search, staff, AI, review, sorting and paging happen here.
// Everything is kept in the URL, so Back from a visit returns to the same view.
export default function VisitsPage() {
  const [params] = useSearchParams()
  const get = (k) => params.get(k) ?? VISIT_FILTERS[k]
  const [city, period, from, to] = ['city', 'period', 'from', 'to'].map(get)

  const load = useCallback(() => listVisits({ city, ...periodRange(period, from, to) }), [city, period, from, to])
  const { data, error, loading, refreshing, loadedAt, reload } = useAsync(load)
  usePendingChanges(reload)

  const table = useTableState({
    rows: data,
    filters: VISIT_FILTERS,
    defaultSort: '-date',
    sortValue: VISIT_SORT,
    searchText: (v) => `${v.schoolName} ${v.staffName} ${v.cityName} ${v.pocName ?? ''}`,
    matches: visitMatches,
  })

  const [cities, setCities] = useState([])
  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])
  const staff = useMemo(() => staffOptions(data), [data])
  const counts = useMemo(() => Object.fromEntries(Object.keys(REVIEW).map((k) => [k, (data ?? []).filter((v) => v.review === k).length])), [data])
  const waitingShown = (table.filtered ?? []).filter((v) => v.review === 'waiting')

  const approveShown = () => {
    if (window.confirm(`Approve ${waitingShown.length} visits? They will appear for the client.`))
      setReviews(
        waitingShown.map((v) => v.id),
        'approved',
      )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visits"
        subtitle={
          loading
            ? 'Loading…'
            : `${formatNumber(table.total)} visit${table.total === 1 ? '' : 's'} · ${formatNumber(counts.approved)} approved · ${formatNumber(counts.waiting)} waiting for review${loadedAt ? ` · updated ${formatTime(loadedAt)}` : ''}`
        }
        action={
          <div className="flex flex-wrap gap-2">
            {table.state.review === 'waiting' && waitingShown.length > 0 && (
              <Button onClick={approveShown}>
                <MdDoneAll className="size-5" /> Approve {formatNumber(waitingShown.length)}
              </Button>
            )}
            <ExportMenu filename={`visits-${todayISO()}`} getRows={() => exportRows(table.filtered)} count={table.total} noun="visits" disabled={!table.total} />
          </div>
        }
      />

      <TableToolbar table={table} placeholder="Search school, Ground Team, city or POC" onRefresh={reload} refreshing={refreshing} sortOptions={SORT_OPTIONS}>
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="City"
          placeholder="All cities"
          value={table.state.city}
          onChange={(e) => table.set({ city: e.target.value })}
          options={cities.map((c) => ({ value: c, label: c }))}
        />
        <PeriodFilter table={table} />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="Ground Team"
          placeholder="All Ground Team"
          value={table.state.staff}
          onChange={(e) => table.set({ staff: e.target.value })}
          options={staff}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="AI count"
          placeholder="All AI results"
          value={table.state.ai}
          onChange={(e) => table.set({ ai: e.target.value })}
          options={AI_FILTERS}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="Review"
          placeholder="All reviews"
          value={table.state.review}
          onChange={(e) => table.set({ review: e.target.value })}
          options={REVIEW_FILTERS}
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
            <NoResults onClear={table.isFiltered ? table.reset : undefined} text={table.isFiltered ? undefined : 'No visits in this period yet.'} />
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
