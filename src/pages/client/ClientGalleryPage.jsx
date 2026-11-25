import PageHeader from '../../components/common/PageHeader'
import { EmptyState, Select, Spinner } from '../../components/ui'
import { PhotoGallery, sharedPhotos } from '../../features/monitoring'
import ClientFilters from './ClientFilters'
import { useClientVisits } from './useClientVisits'

const TYPES = [
  { value: 'activity', label: 'Activity photos' },
  { value: 'headcount', label: 'Class headcount' },
]

// Approved photos only: headcount photos of approved visits + normal photos the admin set to "Show". ★ Best first.
export default function ClientGalleryPage() {
  const { data, error, refreshing, reload, table, cities } = useClientVisits()
  const photos = data ? sharedPhotos(data, table.state.type) : null
  return (
    <div className="space-y-5">
      <PageHeader title="Gallery" subtitle="Approved photos only · ★ Best photos first" />
      <ClientFilters table={table} cities={cities} onRefresh={reload} refreshing={refreshing}>
        <Select
          className="w-full sm:w-44"
          aria-label="Photo type"
          placeholder="All photos"
          value={table.state.type}
          onChange={(e) => table.set({ type: e.target.value })}
          options={TYPES}
        />
      </ClientFilters>
      {error ? (
        <EmptyState title="Couldn’t load photos" text={error} />
      ) : photos ? (
        <PhotoGallery key={`${table.state.type}|${table.state.city}|${table.state.period}`} photos={photos} />
      ) : (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      )}
    </div>
  )
}
