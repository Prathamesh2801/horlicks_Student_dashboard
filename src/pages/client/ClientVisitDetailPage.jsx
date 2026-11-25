import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import { useNavigate, useParams } from 'react-router'
import { MdGroups, MdLocationOn, MdPhotoLibrary } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Card, EmptyState, Spinner } from '../../components/ui'
import { clientVisitPhotos, PhotoGallery } from '../../features/monitoring'
import { useVisit } from '../../features/visits'
import { formatDate, formatNumber } from '../../utils/format'

// One school visit for the client: students reached, location and the photos shared with them (★ Best first).
// Never shown: Ground Team name, POC, faces incl. repeats, AI or review details.
export default function ClientVisitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { visit, error } = useVisit(id)
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/client/visits'))

  if (error) return <EmptyState title="Couldn’t load this visit" text={error} />
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  // Only approved visits are visible to the client.
  if (visit.review !== 'approved') return <EmptyState title="Visit not available" text="This school visit isn’t available." />

  const photos = clientVisitPhotos(visit)
  return (
    <div className="space-y-5">
      <PageHeader title={visit.schoolName} subtitle={`${visit.cityName} · ${formatDate(visit.date)}`} back={back} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <MdGroups className="size-6" />
          </span>
          <div>
            <p className="text-sm text-gray-600">Students reached</p>
            <p className="text-3xl font-bold">{formatNumber(visit.headcount)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <MdPhotoLibrary className="size-6" />
          </span>
          <div>
            <p className="text-sm text-gray-600">Photos</p>
            <p className="text-3xl font-bold">{photos.length}</p>
          </div>
        </Card>
        {visit.lat != null && (
          <Card className="overflow-hidden">
            <MapContainer
              key={visit.id}
              center={[visit.lat, visit.lng]}
              zoom={14}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              className="z-0 h-24"
            >
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker
                center={[visit.lat, visit.lng]}
                radius={8}
                pathOptions={{ color: '#fff', weight: 3, fillColor: '#d7262e', fillOpacity: 1 }}
              />
            </MapContainer>
            <p className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-gray-700">
              <MdLocationOn className="size-4 text-gray-500" /> {visit.cityName}
            </p>
          </Card>
        )}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-bold">Photos</h2>
        <PhotoGallery photos={photos} inVisit />
      </section>
    </div>
  )
}
