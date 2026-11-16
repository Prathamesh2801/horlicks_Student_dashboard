import { Link } from 'react-router'
import { MdChevronRight, MdGroups, MdPhotoLibrary, MdSchool } from 'react-icons/md'
import { formatDate, formatNumber } from '../../../utils/format'
import VisitStatusBadge from './VisitStatusBadge'

export default function VisitCard({ visit, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-200/80 transition hover:ring-brand-200 active:bg-brand-50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center self-start rounded-xl bg-brand-100 text-brand-700">
        <MdSchool className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{visit.schoolName}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {visit.cityName} · {formatDate(visit.date)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-600">
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
