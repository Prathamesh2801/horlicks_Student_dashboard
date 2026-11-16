import { MdOpenInNew } from 'react-icons/md'
import { Card } from '../../../components/ui'
import { formatCoords, formatDate, formatDateTime } from '../../../utils/format'
import HeadcountSummary from './HeadcountSummary'
import PhotoGrid from './PhotoGrid'
import VisitStatusBadge from './VisitStatusBadge'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

// Read-only visit view, shared by the staff summary and the admin detail page.
export default function VisitDetail({ visit, showStaff }) {
  return (
    <div className="space-y-4">
      <HeadcountSummary visit={visit} />

      <Card>
        <dl className="divide-y divide-gray-100">
          <Row label="School">{visit.schoolName}</Row>
          <Row label="City">
            {visit.cityName} · {visit.district}
          </Row>
          <Row label="Visit date">{formatDate(visit.date)}</Row>
          {showStaff && <Row label="Staff">{visit.staffName}</Row>}
          <Row label="Status">
            <VisitStatusBadge status={visit.status} />
          </Row>
          <Row label="Submitted">{formatDateTime(visit.submittedAt)}</Row>
          <Row label="Location">
            <a
              href={`https://www.openstreetmap.org/?mlat=${visit.lat}&mlon=${visit.lng}#map=17/${visit.lat}/${visit.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-600 hover:underline"
            >
              {formatCoords(visit.lat, visit.lng)} <MdOpenInNew />
            </a>
          </Row>
        </dl>
      </Card>

      <div>
        <h2 className="mb-2 font-semibold">Photos ({visit.photoCount})</h2>
        <PhotoGrid photos={visit.photos} />
      </div>
    </div>
  )
}
