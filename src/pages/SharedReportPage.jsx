import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import { MdLinkOff } from 'react-icons/md'
import Logo from '../components/common/Logo'
import { EmptyState, Spinner } from '../components/ui'
import {
  Averages,
  KpiTiles,
  PhotoGallery,
  sharedPhotos,
  TargetCard,
  TrendChart,
  useCampaign,
  visitMatches,
  visitStats,
} from '../features/monitoring'
import { useAsync } from '../hooks/useAsync'
import { openReport } from '../services/api/pending.service'
import { listVisits } from '../services/api/visits.service'
import { formatDateTime, formatNumber } from '../utils/format'

// Report opened from the admin's link: read-only, no login, approved visits the admin chose, no city breakdown.
// ponytail: reads the report + visits through the signed-in session on this device; the server's public
// report endpoint (report.php?id=) will serve it to anyone with the link.
export default function SharedReportPage() {
  const { id } = useParams()
  const load = useCallback(async () => {
    const report = await openReport(id)
    if (!report) return { report: null }
    const all = await listVisits({ city: report.filters.city, dateFrom: report.from, dateTo: report.to })
    const ids = report.visitIds && new Set(report.visitIds)
    const visits = all.filter((v) => v.review === 'approved' && (ids ? ids.has(v.id) : visitMatches(v, { ...report.filters, review: '' })))
    return { report, visits }
  }, [id])
  const { data, error } = useAsync(load)
  const campaign = useCampaign()
  const stats = useMemo(() => data?.visits && visitStats(data.visits), [data])

  if (error)
    return (
      <EmptyState
        icon={MdLinkOff}
        title="This report can’t be opened here"
        text={`${error} (Until the server supports report links, they open only on the device that created them.)`}
      />
    )
  if (!data) return <Spinner className="mx-auto mt-16 size-6 text-brand-700" />
  if (!data.report)
    return (
      <EmptyState
        icon={MdLinkOff}
        title="This link isn’t available"
        text="It may have been turned off or expired. Ask the programme admin for a new link."
      />
    )

  const { report, visits } = data
  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo className="h-10 w-auto" />
          <span className="text-sm font-semibold text-gray-500">Shared report · view only</span>
          <span className="ml-auto hidden text-sm text-gray-500 sm:block">Generated {formatDateTime(report.createdAt)}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{report.title}</h1>
          <p className="mt-1 text-gray-500">
            {report.period} · {formatNumber(visits.length)} approved visits selected by the admin
          </p>
        </div>
        <KpiTiles stats={stats} client targetPct={campaign.progress?.overall.pct} period="approved" />
        {campaign.progress && <TargetCard data={{ ...campaign.progress, byCity: [] }} client />}
        <TrendChart visits={visits} />
        <Averages stats={stats} />
        <section>
          <h2 className="mb-3 text-lg font-bold">Photos</h2>
          <PhotoGallery photos={sharedPhotos(visits)} />
        </section>
        <p className="border-t border-gray-200 pt-4 text-xs text-gray-500">
          Only visits approved by the admin are included. The link was shared by the programme admin and can be turned off at any time.
        </p>
      </main>
    </div>
  )
}
