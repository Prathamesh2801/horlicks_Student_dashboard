import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Spinner } from '../../components/ui'
import { VisitsMap } from '../../features/monitoring'
import { formatNumber } from '../../utils/format'
import ClientFilters from './ClientFilters'
import { useClientVisits } from './useClientVisits'

// Covered schools from approved visits. No staff names.
export default function ClientMapPage() {
  const { data, error, refreshing, reload, table, cities } = useClientVisits()
  const schools = data && new Set(data.map((v) => `${v.city}|${v.schoolName.trim().toLowerCase()}`)).size
  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col gap-4 sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-4rem)]">
      <PageHeader title="Map" subtitle={data ? `${formatNumber(schools)} schools covered · approved visits only` : 'Covered schools'} />
      <ClientFilters table={table} cities={cities} onRefresh={reload} refreshing={refreshing} />
      <div className="min-h-[420px] flex-1 rounded-2xl ring-1 ring-gray-200">
        {error ? (
          <EmptyState title="Couldn’t load the map" text={error} />
        ) : data ? (
          <VisitsMap visits={data} client />
        ) : (
          <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
        )}
      </div>
    </div>
  )
}
