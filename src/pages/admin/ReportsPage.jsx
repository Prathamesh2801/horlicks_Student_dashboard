import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdCheckCircle, MdContentCopy, MdOpenInNew } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, PeriodFilter, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { PERIODS, periodRange } from '../../constants/visit'
import { AI_FILTERS, staffOptions, VISIT_SORT, visitMatches } from '../../features/monitoring'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { createReport, listReports, SAVED_LOCALLY, setReportActive } from '../../services/api/pending.service'
import { getCities, listVisits } from '../../services/api/visits.service'
import { formatDate, formatNumber, formatShortDate } from '../../utils/format'

const FILTERS = { city: '', period: 'this', from: '', to: '', staff: '', ai: '', mode: 'all' }
const EXPIRES = [
  { value: '', label: 'Never' },
  { value: '7', label: 'In 7 days' },
  { value: '30', label: 'In 30 days' },
  { value: '90', label: 'In 90 days' },
]
const reportUrl = (id) => `${window.location.origin}${window.location.pathname}#/r/${id}`
const addDays = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA')
const rangeLabel = ({ period }, range) =>
  period === 'custom' || period === 'this' || period === 'last'
    ? `${range.dateFrom ? formatDate(range.dateFrom) : 'Start'} – ${range.dateTo ? formatDate(range.dateTo) : 'today'}`
    : PERIODS.find((p) => p.value === period)?.label

function CopyButton({ text, label = 'Copy link', primary }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => {},
    )
  return primary ? (
    <Button onClick={copy}>
      {copied ? <MdCheckCircle className="size-5" /> : <MdContentCopy className="size-5" />} {copied ? 'Copied' : label}
    </Button>
  ) : (
    <button type="button" onClick={copy} className="font-semibold text-brand-700 hover:underline">
      {copied ? 'Copied ✓' : label}
    </button>
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

// Admin: choose visits → generate a link the client opens in any browser (no PDF / PPT).
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
  const [expires, setExpires] = useState('')
  const [created, setCreated] = useState(null)
  const reports = useAsync(listReports)
  usePendingChanges(reports.reload)

  const label = rangeLabel(table.state, range)
  const generate = async () => {
    const r = await createReport({
      title: title.trim() || `Horlicks School Activity — ${label}`,
      period: label,
      from: range.dateFrom ?? null,
      to: range.dateTo ?? null,
      filters: { city: table.state.city, staff: table.state.staff, ai: table.state.ai },
      visitIds: all ? null : chosen.map((v) => v.id),
      count: chosen.length,
      expires: expires ? addDays(Number(expires)) : null,
    })
    setCreated(r)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Pick the visits, generate a link and send it to the client. Anyone with the link can open it, no login needed."
      />

      <Card className="overflow-hidden">
        <div className="space-y-3 p-5 pb-3">
          <div>
            <h2 className="font-bold">1 · Choose visits</h2>
            <p className="text-xs text-gray-500">Only approved visits can be added to a report</p>
          </div>
          <TableToolbar table={table} placeholder="Search school or staff" onRefresh={reload} refreshing={refreshing}>
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
              aria-label="Staff"
              placeholder="All staff"
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
                    <th className="px-3 py-3">Staff</th>
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
        <h2 className="font-bold">2 · Generate link</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <Input
            label="Report title"
            placeholder={`Horlicks School Activity — ${label}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <Select label="Link expires" value={expires} onChange={(e) => setExpires(e.target.value)} options={EXPIRES} />
          <Button onClick={generate} disabled={!chosen.length} className="sm:mb-px">
            Generate link
          </Button>
        </div>
        {created && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
            <div className="text-sm">
              <p className="font-bold text-green-700">✓ Link ready</p>
              <p className="text-xs text-gray-600">{formatNumber(created.count)} visits</p>
            </div>
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-gray-200">
              {reportUrl(created.id)}
            </code>
            <CopyButton text={reportUrl(created.id)} primary />
            <a
              href={reportUrl(created.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-gray-300 hover:bg-brand-50"
            >
              <MdOpenInNew className="size-4" /> Open
            </a>
          </div>
        )}
        <p className="text-xs text-gray-400">{SAVED_LOCALLY} Until then the link opens on this device only.</p>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Shared reports</h2>
        {!reports.data?.length ? (
          <p className="px-5 pb-6 pt-2 text-sm text-gray-500">No report links yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3">Visits</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Opened</th>
                  <th className="px-5 py-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold">{r.title}</td>
                    <td className="px-3 py-3">{r.period}</td>
                    <td className="px-3 py-3">{formatNumber(r.count)}</td>
                    <td className="px-3 py-3">{formatShortDate(r.createdAt)}</td>
                    <td className="px-3 py-3 text-gray-500">{r.opens ? `${r.opens} times` : '—'}</td>
                    <td className="px-5 py-3">
                      {r.active ? (
                        <div className="flex gap-4">
                          <CopyButton text={reportUrl(r.id)} />
                          <a
                            href={reportUrl(r.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-brand-700 hover:underline"
                          >
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => setReportActive(r.id, false)}
                            className="font-semibold text-accent-600 hover:underline"
                          >
                            Turn off
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Badge>Link turned off</Badge>
                          <button
                            type="button"
                            onClick={() => setReportActive(r.id, true)}
                            className="font-semibold text-brand-700 hover:underline"
                          >
                            Turn on
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-5 py-3 text-xs text-gray-500">
          Turning a link off stops it working for everyone. Reports only ever show approved visits.
        </p>
      </Card>
    </div>
  )
}
