import { useMemo } from 'react'
import { MdCloudOff } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { Averages, CityChart, KpiTiles, TargetCard, TrendChart, useCampaign, visitStats } from '../../features/monitoring'
import { formatDateTime } from '../../utils/format'
import ClientFilters from './ClientFilters'
import { useClientVisits } from './useClientVisits'

// Client home: approved visits only, numbers don't change while the client is looking.
export default function ClientOverviewPage() {
  const { data, error, loading, refreshing, loadedAt, reload, table, cities, city } = useClientVisits()
  const campaign = useCampaign()
  const stats = useMemo(() => data && visitStats(data, city ? [city] : cities), [data, cities, city])

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Overview"
        subtitle={`Horlicks School Activity · approved visits only${loadedAt ? ` · last updated ${formatDateTime(loadedAt)}` : ''}`}
      />
      <ClientFilters table={table} cities={cities} onRefresh={reload} refreshing={refreshing} />
      {error && !data ? (
        <EmptyState icon={MdCloudOff} title="Couldn’t load the overview" text={error} />
      ) : loading || !stats ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <>
          <KpiTiles stats={stats} client targetPct={campaign.progress?.overall.pct} period="approved" />
          {campaign.progress && <TargetCard data={campaign.progress} client />}
          <div className="grid gap-5 lg:grid-cols-2">
            <TrendChart visits={data} />
            <CityChart rows={stats.byCity} period="Approved visits" />
          </div>
          <Averages stats={stats} />
          <p className="text-xs text-gray-500">
            Numbers only include visits approved by the admin, so they do not change while you are looking at them.
          </p>
        </>
      )}
    </div>
  )
}
