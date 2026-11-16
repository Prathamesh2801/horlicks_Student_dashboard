import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MdChevronLeft, MdChevronRight, MdDownload, MdSearchOff } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, Spinner } from '../../components/ui'
import { periodMonth, VISIT_STATUS } from '../../constants/visit'
import { Filters, VisitsTable } from '../../features/monitoring'
import { getCities } from '../../services/api/cities'
import { listVisits } from '../../services/api/visits'
import { downloadCsv } from '../../utils/downloadCsv'
import { formatNumber, todayISO } from '../../utils/format'

const PAGE_SIZE = 10
const DEFAULTS = { q: '', cityId: '', status: '', period: 'this' }

// [1, '…', 4, 5, 6, '…', 20]
function pageList(page, count) {
  const pages = [...new Set([1, page - 1, page, page + 1, count])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  return pages.flatMap((n, i) => (i && n - pages[i - 1] > 1 ? ['…', n] : [n]))
}

function exportCsv(visits) {
  downloadCsv(`visits-${todayISO()}.csv`, [
    ['Date', 'School', 'City', 'District', 'Staff', 'Status', 'Photos', 'AI count', 'Latitude', 'Longitude', 'Submitted'],
    ...visits.map((v) => [
      v.date,
      v.schoolName,
      v.cityName,
      v.district,
      v.staffName,
      VISIT_STATUS[v.status]?.label,
      v.photoCount,
      v.headcount,
      v.lat,
      v.lng,
      v.submittedAt,
    ]),
  ])
}

// Filters and page live in the URL, so Back from a visit returns to the same list.
// ponytail: filters + pages client-side; pass page/limit to the real API once it paginates.
export default function VisitsPage() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, params.get(k) ?? d]))
  const page = Number(params.get('page')) || 1
  const [cities, setCities] = useState([])
  const [visits, setVisits] = useState(null)

  const update = (next) =>
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== DEFAULTS[k] && !(k === 'page' && v === 1))), {
      replace: true,
    })

  useEffect(() => {
    getCities().then(setCities)
  }, [])

  const { q, cityId, status, period } = filters
  useEffect(() => {
    let live = true
    const timer = setTimeout(
      () => listVisits({ q, cityId, status, month: periodMonth(period) }).then((v) => live && setVisits(v)),
      200,
    )
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [q, cityId, status, period])

  const pageCount = Math.max(1, Math.ceil((visits?.length ?? 0) / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = visits?.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) ?? []
  const goTo = (n) => update({ ...filters, page: n })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visits"
        subtitle={visits ? `${formatNumber(visits.length)} visits · click a row to open it` : 'Loading…'}
        action={
          <Button variant="secondary" onClick={() => exportCsv(visits)} disabled={!visits?.length}>
            <MdDownload className="size-5" /> Export
          </Button>
        }
      />
      <Filters value={filters} onChange={(f) => update({ ...f, page: 1 })} cities={cities} />

      {!visits ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : visits.length === 0 ? (
        <EmptyState
          icon={MdSearchOff}
          title="No visits match these filters"
          action={
            <Button variant="secondary" onClick={() => update({ ...DEFAULTS, period: 'all' })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <VisitsTable visits={rows} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
            <p className="text-sm text-gray-500">
              Showing {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + rows.length} of {formatNumber(visits.length)}
            </p>
            {pageCount > 1 && (
              <nav className="flex items-center gap-1.5" aria-label="Pages">
                <PageButton onClick={() => goTo(current - 1)} disabled={current === 1} label="Previous page">
                  <MdChevronLeft className="size-5" />
                </PageButton>
                {pageList(current, pageCount).map((n, i) =>
                  n === '…' ? (
                    <span key={`gap${i}`} className="px-1 text-gray-400">
                      …
                    </span>
                  ) : (
                    <PageButton key={n} onClick={() => goTo(n)} active={n === current} label={`Page ${n}`}>
                      {n}
                    </PageButton>
                  ),
                )}
                <PageButton onClick={() => goTo(current + 1)} disabled={current === pageCount} label="Next page">
                  <MdChevronRight className="size-5" />
                </PageButton>
              </nav>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function PageButton({ active, label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition disabled:opacity-40 ${
        active ? 'bg-brand-700 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
