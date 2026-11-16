import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router'
import { MdGroups, MdPhotoLibrary } from 'react-icons/md'
import { STATUS_COLOR } from '../../../constants/visit'
import { formatDate, formatNumber } from '../../../utils/format'
import { VisitStatusBadge } from '../../visits'

const ODISHA_CENTER = [20.5, 84.6]

// ponytail: plain markers; add leaflet.markercluster when visits reach the thousands.
export default function VisitsMap({ visits }) {
  return (
    <MapContainer center={ODISHA_CENTER} zoom={7} className="z-0 size-full min-h-[420px] rounded-2xl" scrollWheelZoom>
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
            pathOptions={{ color: '#fff', weight: 2, fillColor: STATUS_COLOR[v.status], fillOpacity: 1 }}
          >
            <Popup>
              <div className="min-w-52 space-y-2 font-sans">
                <div>
                  <p className="text-sm font-bold text-gray-900">{v.schoolName}</p>
                  <p className="text-xs text-gray-500">
                    {v.cityName} · {formatDate(v.date)} · {v.staffName}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-gray-800">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <MdGroups className="size-4 text-brand-700" /> AI count {formatNumber(v.headcount)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MdPhotoLibrary className="size-4 text-gray-500" /> {v.photoCount} photos
                  </span>
                </div>
                <VisitStatusBadge status={v.status} />
                <Link to={`/admin/visits/${v.id}`} className="block text-xs font-semibold !text-brand-700">
                  Open visit →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  )
}
