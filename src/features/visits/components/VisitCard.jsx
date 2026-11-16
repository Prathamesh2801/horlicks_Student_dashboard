import { Link } from 'react-router'
import { MdChevronRight, MdGroups, MdPhotoLibrary } from 'react-icons/md'
import { formatDate, formatNumber } from '../../../utils/format'
import VisitStatusBadge from './VisitStatusBadge'

export default function VisitCard({ visit, to }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:ring-brand-200">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{visit.schoolName}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          {visit.cityName} · {formatDate(visit.date)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <VisitStatusBadge status={visit.status} />
          <span className="inline-flex items-center gap-1">
            <MdPhotoLibrary /> {visit.photoCount} photos
          </span>
          <span className="inline-flex items-center gap-1">
            <MdGroups /> {formatNumber(visit.headcount)} students
          </span>
        </div>
      </div>
      <MdChevronRight className="size-5 shrink-0 text-gray-400" />
    </Link>
  )
}
