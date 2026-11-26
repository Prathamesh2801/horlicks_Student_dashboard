import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdContentCopy, MdPictureAsPdf } from 'react-icons/md'
import ExportMenu from '../../components/common/ExportMenu'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, PeriodFilter, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Badge, Button, Card, Select, Spinner } from '../../components/ui'
import { periodRange } from '../../constants/visit'
import { AI_FILTERS, photoRows, staffOptions, VISIT_SORT, visitMatches, visitRows } from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { createReport, listReports, REPORT_MAX_VISITS, retryReport, waitForReport } from '../../services/api/reports.service'
import { getCities, listVisits } from '../../services/api/visits.service'
import { formatDateTime, formatNumber, formatShortDate, todayISO } from '../../utils/format'

const FILTERS = { city: '', period: 'this', from: '', to: '', staff: '', ai: '', mode: 'all' }
const REPORT_STATUS = {
  waiting: ['amber', 'Waiting'],
  working: ['brand', 'Making PDF'],
  ready: ['green', 'Ready'],
  failed: ['red', 'Failed'],
}
const sizeText = (b) => (b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`)

// Open the PDF, or copy its link to paste into WhatsApp / email (the link works without login).
function PdfLinks({ report, primary }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(report.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const open = primary
    ? 'inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800'
    : 'font-semibold text-brand-700 hover:underline'
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <a href={report.url} target="_blank" rel="noreferrer" className={open}>
        {primary && <MdPictureAsPdf className="size-5" />} Open PDF
      </a>
      <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <MdContentCopy className="size-4" /> {copied ? 'Copied ✓' : 'Copy link'}
      </button>
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

  const [job, setJob] = useState(null) // { report, error } for the PDF being made
  const reports = useAsync(listReports)
  const busy = Boolean(job && !job.error && job.report?.status !== 'ready' && job.report?.status !== 'failed')
  const tooMany = chosen.length > REPORT_MAX_VISITS

  const follow = async (start) => {
    setJob({ report: null })
    try {
      let report = await start()
      setJob({ report })
      reports.reload()
      report = await waitForReport(report.id, (r) => setJob({ report: r }))
      setJob({ report, error: report.status === 'failed' ? report.error || 'The server couldn’t make the PDF.' : null })
    } catch (err) {
      setJob({ report: null, error: err.message })
    }
    reports.reload()
  }
  const generate = () => follow(() => createReport(chosen.map((v) => v.id))) // in the table's order
  const retry = (id) => follow(() => retryReport(id))

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Pick the visits, make a PDF and share its link with the client (WhatsApp, email…)." />

      <Card className="overflow-hidden">
        <div className="space-y-3 p-5 pb-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="mr-auto">
              <h2 className="font-bold">1 · Choose visits</h2>
              <p className="text-xs text-gray-500">Only approved visits can be added to a report</p>
            </div>
            <ExportMenu
              filename={`report-visits-${todayISO()}`}
              getRows={() => visitRows(chosen)}
              getPhotoRows={() => photoRows(chosen)}
              count={chosen.length}
              noun="selected visits"
              disabled={!chosen.length}
            />
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="font-bold">2 · Generate PDF</h2>
            <p className="text-xs text-gray-500">
              Summary, then each visit with its details and photos (★ Best first). Up to {REPORT_MAX_VISITS} visits per PDF.
            </p>
          </div>
          <Button onClick={generate} disabled={!chosen.length || tooMany || busy}>
            <MdPictureAsPdf className="size-5" /> Generate PDF · {formatNumber(chosen.length)} visits
          </Button>
        </div>
        {tooMany && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            {formatNumber(chosen.length)} visits selected: one PDF can hold {REPORT_MAX_VISITS}. Narrow the filters or tick the visits.
          </p>
        )}
        {busy && (
          <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
            <Spinner className="size-4" />
            {job.report?.status === 'working' ? 'Making the PDF…' : 'Waiting for the server to start the PDF…'} It also appears under
            “Generated reports”, so you can leave this page.
          </p>
        )}
        {job?.report?.status === 'ready' && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
            <div className="flex-1 text-sm">
              <p className="font-bold text-green-700">✓ PDF ready</p>
              <p className="text-xs text-gray-600">
                {formatNumber(job.report.visits)} visits · {job.report.pages} pages · {sizeText(job.report.size)}
                {job.report.skipped.length > 0 && ` · ${job.report.skipped.length} visits left out (no longer visible)`}
              </p>
            </div>
            <PdfLinks report={job.report} primary />
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
        {reports.error && !reports.data ? (
          <LoadError message={reports.error} onRetry={reports.reload} />
        ) : !reports.data ? (
          <TableSkeleton />
        ) : !reports.data.length ? (
          <p className="px-5 pb-6 pt-2 text-sm text-gray-500">No reports yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Report</th>
                  <th className="px-3 py-3">Visits</th>
                  <th className="px-3 py-3">PDF</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold">
                      #{r.id}
                      {r.by && <span className="block text-xs font-normal text-gray-500">by {r.by}</span>}
                    </td>
                    <td className="px-3 py-3">{formatNumber(r.visits)}</td>
                    <td className="px-3 py-3">{r.pages ? `${r.pages} pages · ${sizeText(r.size)}` : '—'}</td>
                    <td className="px-3 py-3">{formatDateTime(r.createdAt)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={REPORT_STATUS[r.status][0]}>{REPORT_STATUS[r.status][1]}</Badge>
                      {r.status === 'failed' && r.error && <span className="block max-w-56 text-xs text-gray-500">{r.error}</span>}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === 'ready' && r.url ? (
                        <PdfLinks report={r} />
                      ) : r.status === 'failed' ? (
                        <button
                          type="button"
                          onClick={() => retry(r.id)}
                          disabled={busy}
                          className="font-semibold text-brand-700 hover:underline disabled:opacity-50"
                        >
                          Try again
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-5 py-3 text-xs text-gray-500">
          Anyone with a PDF link can open that PDF, so share it only with the right people. Reports made by an admin include the POC name
          and number and all normal photos.
        </p>
      </Card>
    </div>
  )
}
