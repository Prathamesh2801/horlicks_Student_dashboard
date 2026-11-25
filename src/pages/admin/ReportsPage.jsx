import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdDownload, MdPictureAsPdf } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, PeriodFilter, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Badge, Button, Card, Input, Select, Spinner } from '../../components/ui'
import { brand } from '../../config/brand'
import { PERIODS, periodRange } from '../../constants/visit'
import { AI_FILTERS, staffOptions, VISIT_SORT, visitMatches } from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { createReport, downloadReport, listReports, waitForReport } from '../../services/api/reports.service'
import { getCities, listVisits } from '../../services/api/visits.service'
import { formatDate, formatDateTime, formatNumber, formatShortDate } from '../../utils/format'

const FILTERS = { city: '', period: 'this', from: '', to: '', staff: '', ai: '', mode: 'all' }
const rangeLabel = ({ period }, range) =>
  period === 'custom' || period === 'this' || period === 'last'
    ? `${range.dateFrom ? formatDate(range.dateFrom) : 'Start'} – ${range.dateTo ? formatDate(range.dateTo) : 'today'}`
    : PERIODS.find((p) => p.value === period)?.label
const REPORT_STATUS = { processing: ['amber', 'Preparing'], ready: ['green', 'Ready'], failed: ['red', 'Failed'] }

function DownloadButton({ report, primary }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      await downloadReport(report)
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }
  return (
    <span className="inline-flex flex-col">
      {primary ? (
        <Button onClick={go} loading={busy}>
          <MdDownload className="size-5" /> Download PDF
        </Button>
      ) : (
        <button type="button" onClick={go} disabled={busy} className="font-semibold text-brand-700 hover:underline disabled:opacity-50">
          {busy ? 'Downloading…' : 'Download'}
        </button>
      )}
      {error && <span className="mt-1 text-xs text-accent-600">{error}</span>}
    </span>
  )
}

// Only approved visits can go into a report.
function useApprovedVisits(city, period, from, to) {
  const load = useCallback(
    async () => (await listVisits({ city, ...periodRange(period, from, to) })).filter((v) => v.review === 'approved'),
    [city, period, from, to],
  )
  return useAsync(load)
}

// Admin: choose visits → the server builds a PDF → download it and share the file.
export default function ReportsPage() {
  const [params] = useSearchParams()
  const get = (k) => params.get(k) ?? FILTERS[k]
  const [city, period, from, to] = ['city', 'period', 'from', 'to'].map(get)
  const range = periodRange(period, from, to)

  const { data, error, loading, reload, refreshing } = useApprovedVisits(city, period, from, to)
  usePendingChanges(reload)
  const table = useTableState({
    rows: data,
    filters: FILTERS,
    defaultSort: '-date',
    sortValue: VISIT_SORT,
    searchText: (v) => `${v.schoolName} ${v.staffName}`,
    matches: visitMatches,
  })
  const [cities, setCities] = useState([])
  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])

  const [ticked, setTicked] = useState(() => new Set())
  const all = table.state.mode === 'all'
  const chosen = useMemo(() => (table.filtered ?? []).filter((v) => all || ticked.has(v.id)), [table.filtered, all, ticked])
  const toggle = (id) =>
    setTicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const pageIds = (table.rows ?? []).map((v) => v.id)
  const pageAllTicked = pageIds.length > 0 && pageIds.every((id) => ticked.has(id))

  const [title, setTitle] = useState('')
  const [job, setJob] = useState(null) // { report, error, seconds } for the PDF being made
  const reports = useAsync(listReports)
  // No report endpoint on the server yet (404) → explain instead of failing.
  const notOnServer = reports.error && /404|not found/i.test(reports.error)

  const label = rangeLabel(table.state, range)
  const busy = Boolean(job && !job.error && job.report?.status !== 'ready')
  const generate = async () => {
    const started = Date.now()
    const tick = (report) => setJob({ report, seconds: Math.round((Date.now() - started) / 1000) })
    setJob({ report: null, seconds: 0 })
    try {
      const username = data.find((v) => v.staffName === table.state.staff)?.staffId
      let report = await createReport({
        title: title.trim() || `${brand.fullName} — ${label}`,
        // All approved visits matching the filters (the server finds them), or only the ticked ones.
        filters: all
          ? {
              date_from: range.dateFrom ?? null,
              date_to: range.dateTo ?? null,
              city: table.state.city || null,
              username: username ?? null,
              ai: table.state.ai || null,
            }
          : undefined,
        visitIds: all ? undefined : chosen.map((v) => v.id),
      })
      tick(report)
      if (report.status === 'processing') report = await waitForReport(report.id, tick)
      setJob({ report, error: report.status === 'failed' ? report.error || 'The server couldn’t make the PDF.' : null })
    } catch (err) {
      setJob({ report: null, error: err.message })
    }
    reports.reload()
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Pick the visits and download a PDF report to share with the client (WhatsApp, email…)." />

      <Card className="overflow-hidden">
        <div className="space-y-3 p-5 pb-3">
          <div>
            <h2 className="font-bold">1 · Choose visits</h2>
            <p className="text-xs text-gray-500">Only approved visits can be added to a report</p>
          </div>
          <TableToolbar table={table} placeholder="Search school or Ground Team" onRefresh={reload} refreshing={refreshing}>
            <PeriodFilter table={table} />
            <Select
              className="w-[calc(50%-0.25rem)] sm:w-40"
              aria-label="City"
              placeholder="All cities"
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
              options={staffOptions(data)}
            />
            <Select
              className="w-full sm:w-40"
              aria-label="AI count"
              placeholder="All AI results"
              value={table.state.ai}
              onChange={(e) => table.set({ ai: e.target.value })}
              options={AI_FILTERS}
            />
          </TableToolbar>
          <div
            role="radiogroup"
            aria-label="Which visits"
            className="inline-grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold"
          >
            {[
              ['all', `All approved visits · ${formatNumber(table.total)}`],
              ['ticked', 'Only the visits I tick'],
            ].map(([m, text]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={table.state.mode === m}
                onClick={() => table.set({ mode: m, page: table.state.page })}
                className={`rounded-lg px-4 py-2 transition ${table.state.mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600'}`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        {error && !data ? (
          <LoadError message={error} onRetry={reload} />
        ) : loading ? (
          <TableSkeleton />
        ) : table.total === 0 ? (
          <NoResults
            onClear={table.isFiltered ? table.reset : undefined}
            text={table.isFiltered ? undefined : 'No approved visits in this period. Approve visits on the Visits page first.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="w-12 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Tick all on this page"
                        disabled={all}
                        checked={all || pageAllTicked}
                        onChange={() =>
                          setTicked((s) => new Set(pageAllTicked ? [...s].filter((id) => !pageIds.includes(id)) : [...s, ...pageIds]))
                        }
                        className="size-4 accent-brand-700"
                      />
                    </th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">School</th>
                    <th className="px-3 py-3">City</th>
                    <th className="px-3 py-3">Ground Team</th>
                    <th className="px-3 py-3">Students</th>
                    <th className="px-3 py-3">Photos shown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.rows.map((v) => (
                    <tr key={v.id} className={all || ticked.has(v.id) ? '' : 'text-gray-400'}>
                      <td className="px-5 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Include ${v.schoolName}`}
                          disabled={all}
                          checked={all || ticked.has(v.id)}
                          onChange={() => toggle(v.id)}
                          className="size-4 accent-brand-700"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{formatShortDate(v.date)}</td>
                      <td className="px-3 py-2.5 font-semibold">{v.schoolName}</td>
                      <td className="px-3 py-2.5">{v.cityName}</td>
                      <td className="px-3 py-2.5">{v.staffName}</td>
                      <td className="px-3 py-2.5">{formatNumber(v.headcount)}</td>
                      <td className="px-3 py-2.5">{v.photos.filter((p) => p.show).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-3 text-sm">
              <b>
                {formatNumber(chosen.length)} visits selected · {formatNumber(chosen.reduce((s, v) => s + (v.headcount ?? 0), 0))} students
                · {formatNumber(chosen.reduce((s, v) => s + v.photos.filter((p) => p.show).length, 0))} photos shown
              </b>
            </div>
            <Pagination table={table} noun="visits" />
          </>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold">2 · Generate PDF</h2>
        {notOnServer ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            PDF reports aren’t available on the server yet. This step works as soon as the server adds <code>Admin/report.php</code>.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Report title"
              placeholder={`${brand.fullName} — ${label}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
            <Button onClick={generate} disabled={!chosen.length || busy} className="sm:mb-px">
              <MdPictureAsPdf className="size-5" /> Generate PDF · {formatNumber(chosen.length)} visits
            </Button>
          </div>
        )}
        {busy && (
          <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
            <Spinner className="size-4" /> Preparing your PDF… {job.seconds ? `${job.seconds} s` : ''} Please stay on this page.
          </p>
        )}
        {job?.report?.status === 'ready' && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
            <div className="flex-1 text-sm">
              <p className="font-bold text-green-700">✓ PDF ready</p>
              <p className="text-xs text-gray-600">
                {job.report.title}
                {job.report.visits != null && ` · ${formatNumber(job.report.visits)} visits`}
                {job.report.photos != null && ` · ${formatNumber(job.report.photos)} photos`}
              </p>
            </div>
            <DownloadButton report={job.report} primary />
          </div>
        )}
        {job?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {job.error}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Generated reports</h2>
        {notOnServer ? (
          <p className="px-5 pb-6 pt-2 text-sm text-gray-500">Waiting for the server’s report endpoint.</p>
        ) : reports.error && !reports.data ? (
          <LoadError message={reports.error} onRetry={reports.reload} />
        ) : !reports.data?.length ? (
          <p className="px-5 pb-6 pt-2 text-sm text-gray-500">No reports yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-3 py-3">Visits</th>
                  <th className="px-3 py-3">Photos</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold">
                      {r.title}
                      {r.period && <span className="block text-xs font-normal text-gray-500">{r.period}</span>}
                    </td>
                    <td className="px-3 py-3">{formatNumber(r.visits)}</td>
                    <td className="px-3 py-3">{formatNumber(r.photos)}</td>
                    <td className="px-3 py-3">{formatDateTime(r.createdAt)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={REPORT_STATUS[r.status][0]}>{REPORT_STATUS[r.status][1]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {r.status === 'ready' && r.url ? <DownloadButton report={r} /> : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-5 py-3 text-xs text-gray-500">Reports only include approved visits. Share the downloaded PDF file.</p>
      </Card>
    </div>
  )
}
