import { useMemo } from 'react'
import { MdCloudOff } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { Averages, CityChart, KpiTiles, TargetCard, TrendChart, useCampaign, visitStats } from '../../features/monitoring'
import { brand } from '../../config/brand'
import { formatDateTime } from '../../utils/format'
import ClientFilters from './ClientFilters'
import { useClientVisits } from './useClientVisits'

// Client home. Only approved visits are counted, but the client view never says "approved".
export default function ClientOverviewPage() {
  const { data, error, loading, refreshing, loadedAt, reload, table, cities, city } = useClientVisits()
  const campaign = useCampaign()
  const stats = useMemo(() => data && visitStats(data, city ? [city] : cities), [data, cities, city])

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Overview" subtitle={`${brand.fullName}${loadedAt ? ` · last updated ${formatDateTime(loadedAt)}` : ''}`} />
      <ClientFilters table={table} cities={cities} onRefresh={reload} refreshing={refreshing} />
      {error && !data ? (
        <EmptyState icon={MdCloudOff} title="Couldn’t load the overview" text={error} />
      ) : loading || !stats ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <>
          <KpiTiles stats={stats} client targetPct={campaign.progress?.overall.pct} />
          {campaign.progress && <TargetCard data={campaign.progress} client />}
          <div className="grid gap-5 lg:grid-cols-2">
            <TrendChart visits={data} note="Per week" />
            <CityChart rows={stats.byCity} period="School visits per district" />
          </div>
          <Averages stats={stats} />
        </>
      )}
    </div>
  )
}
