import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router'
import { formatDate, formatNumber } from '../../../utils/format'

const STATUS_COLOR = { draft: '#9ca3af', processing: '#f59e0b', completed: '#16a34a' }
const ODISHA_CENTER = [20.5, 84.6]

// ponytail: plain markers; add leaflet.markercluster when visits reach the thousands.
export default function VisitsMap({ visits }) {
  return (
    <MapContainer center={ODISHA_CENTER} zoom={7} className="h-full min-h-[420px] w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visits
        .filter((v) => v.lat != null)
        .map((v) => (
          <CircleMarker
            key={v.id}
            center={[v.lat, v.lng]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: STATUS_COLOR[v.status], fillOpacity: 0.9 }}
          >
            <Popup>
              <p className="font-semibold">{v.schoolName}</p>
              <p className="text-gray-600">
                {v.cityName} · {formatDate(v.date)}
              </p>
              <p>
                AI count: <b>{formatNumber(v.headcount)}</b> · Photos: {v.photoCount}
              </p>
              <Link to={`/admin/visits/${v.id}`} className="text-brand-600">
                Open visit →
              </Link>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  )
}
