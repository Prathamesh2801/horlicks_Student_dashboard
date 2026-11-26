import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import { MdLocationOn } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { formatCoords, formatDate, formatDateTime, mapUrl } from '../../../utils/format'
import HeadcountSummary from './HeadcountSummary'
import PhotoGrid from './PhotoGrid'
import AuditCard from './AuditCard'
import CountCorrection from './CountCorrection'
import ReviewCard from './ReviewCard'
import { useState } from 'react'
import { Button } from '../../../components/ui'
import { retryAiCount, setClientPhotos } from '../../../services/api/visits.service'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

function MapLink({ visit }) {
  return (
    <a href={mapUrl(visit.lat, visit.lng)} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
      {formatCoords(visit.lat, visit.lng)}
    </a>
  )
}

function LocationCard({ visit }) {
  if (visit.lat == null) return null
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-bold">Location</h2>
      <MapContainer
        key={visit.id}
        center={[visit.lat, visit.lng]}
        zoom={14}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        className="z-0 h-44 rounded-xl"
      >
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CircleMarker
          center={[visit.lat, visit.lng]}
          radius={9}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#d7262e', fillOpacity: 1 }}
        />
      </MapContainer>
      <p className="mt-3 flex items-center gap-1 text-sm font-semibold">
        <MdLocationOn className="size-4 text-gray-500" /> {formatCoords(visit.lat, visit.lng)}
        {visit.accuracy != null && <span className="font-normal text-gray-500">· ±{visit.accuracy} m</span>}
      </p>
      <a
        href={mapUrl(visit.lat, visit.lng)}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        Open in map →
      </a>
    </Card>
  )
}

// Read-only visit view. admin = two-column desktop layout with the map; otherwise the staff phone summary.
export default function VisitDetail({ visit, admin }) {
  const head = visit.photos.filter((p) => p.type === 'headcount')
  const normal = visit.photos.filter((p) => p.type !== 'headcount')
  const [flagError, setFlagError] = useState(null)

  // Admin: Show = the client may see the photo; ★ Best = shown first. Best needs Show; hiding clears Best.
  const flag = async (photo, change) => {
    setFlagError(null)
    const show = 'show' in change ? change.show : change.best || photo.show
    const best = 'best' in change ? change.best : show && photo.best
    const ids = (key, own) => normal.filter((p) => (p.id === photo.id ? own : p[key])).map((p) => p.id)
    try {
      await setClientPhotos(visit.id, ids('show', show), ids('best', best))
    } catch (err) {
      setFlagError(err.message)
    }
  }
  const [retrying, setRetrying] = useState(false)
  const retry = async () => {
    setRetrying(true)
    setFlagError(null)
    await retryAiCount(visit.id).catch((err) => setFlagError(err.message))
    setRetrying(false)
  }

  const details = (
    <Card className="p-5">
      {admin && <h2 className="mb-1 font-bold">Visit details</h2>}
      <dl className="divide-y divide-gray-100">
        {admin && <Row label="School">{visit.schoolName}</Row>}
        <Row label="City">{visit.cityName}</Row>
        {visit.district && <Row label="District">{visit.district}</Row>}
        {visit.village && <Row label="Village">{visit.village}</Row>}
        {visit.udise && <Row label="UDISE code">{visit.udise}</Row>}
        {visit.schoolType && <Row label="School type">{visit.schoolType}</Row>}
        {visit.classCategory && <Row label="Class category">{visit.classCategory}</Row>}
        <Row label="Visit date">{formatDate(visit.date)}</Row>
        {visit.pocName && (
          <Row label="POC">
            {visit.pocName}
            {visit.pocContact && (
              <a href={`tel:${visit.pocContact}`} className="block font-normal text-brand-700 hover:underline">
                {visit.pocContact}
              </a>
            )}
          </Row>
        )}
        <Row label="Ground Team">{visit.staffName}</Row>
        {visit.startTime && <Row label="Visit started">{visit.startTime}</Row>}
        <Row label="Submitted">{formatDateTime(visit.submittedAt)}</Row>
        {admin ? (
          <Row label="Photos">
            {normal.length} normal · {head.length} headcount
          </Row>
        ) : (
          <Row label="Location">
            <MapLink visit={visit} />
          </Row>
        )}
      </dl>
    </Card>
  )

  const headSection = (
    <section>
      <h2 className="mb-2 font-bold">
        Headcount photos · AI count ({head.length})
        {admin && <span className="ml-1 text-sm font-normal text-gray-500">· shown to the client once the visit is approved</span>}
      </h2>
      {admin && visit.aiFailed > 0 && !visit.aiCounting && (
        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          <span className="flex-1">AI could not count these photos{visit.aiError ? `: ${visit.aiError}` : '.'}</span>
          <Button variant="secondary" onClick={retry} loading={retrying}>
            Count again
          </Button>
        </div>
      )}
      {head.length ? <PhotoGrid photos={head} className="grid-cols-3" /> : <p className="text-sm text-gray-500">No headcount photos.</p>}
    </section>
  )

  const normalSection = (
    <section>
      <h2 className="mb-2 font-bold">
        Normal photos ({normal.length})
        {admin && normal.length > 0 && (
          <span className="ml-1 text-sm font-normal text-gray-500">
            · {normal.filter((p) => p.show).length} shown to client · {normal.filter((p) => p.best).length} ★ best
          </span>
        )}
      </h2>
      {flagError && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {flagError}
        </p>
      )}
      {normal.length ? (
        <PhotoGrid
          photos={normal}
          onFlag={admin ? flag : undefined}
          className={admin ? 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-6' : 'grid-cols-4'}
        />
      ) : (
        <p className="text-sm text-gray-500">No normal photos.</p>
      )}
    </section>
  )

  if (!admin)
    return (
      <div className="space-y-5">
        <HeadcountSummary visit={visit} />
        {headSection}
        {details}
        {normalSection}
      </div>
    )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <div className="space-y-2">
          <HeadcountSummary visit={visit} />
          <CountCorrection visit={visit} />
        </div>
        {headSection}
        {normalSection}
      </div>
      <div className="space-y-6">
        <ReviewCard visit={visit} />
        <AuditCard visit={visit} />
        {details}
        <LocationCard visit={visit} />
      </div>
    </div>
  )
}
