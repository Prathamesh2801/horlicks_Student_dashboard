import { Link, useNavigate } from 'react-router'
import { MdChevronRight } from 'react-icons/md'
import { formatDate, formatNumber, formatShortDate } from '../../../utils/format'
import { VisitStatusBadge } from '../../visits'

function AiCount({ visit }) {
  if (visit.status === 'processing') return <span className="font-semibold text-amber-600">counting…</span>
  return <span className="font-bold">{formatNumber(visit.headcount)}</span>
}

// Table on tablet/desktop, compact list on phones. Render inside a Card with p-0.
export default function VisitsTable({ visits }) {
  const navigate = useNavigate()
  const open = (v) => navigate(`/admin/visits/${v.id}`)

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-3 py-3">School</th>
            <th className="px-3 py-3">City</th>
            <th className="hidden px-3 py-3 lg:table-cell">Staff</th>
            <th className="hidden px-3 py-3 xl:table-cell">Photos</th>
            <th className="px-3 py-3">AI count</th>
            <th className="px-3 py-3">Status</th>
            <th className="w-10" aria-hidden="true" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visits.map((v) => (
            <tr
              key={v.id}
              tabIndex={0}
              onClick={() => open(v)}
              onKeyDown={(e) => e.key === 'Enter' && open(v)}
              className="cursor-pointer outline-none transition hover:bg-brand-50 focus-visible:bg-brand-50"
            >
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-700">{formatShortDate(v.date)}</td>
              <td className="px-3 py-3.5 font-semibold">{v.schoolName}</td>
              <td className="px-3 py-3.5 text-gray-700">{v.cityName}</td>
              <td className="hidden px-3 py-3.5 text-gray-700 lg:table-cell">{v.staffName}</td>
              <td className="hidden px-3 py-3.5 text-gray-700 xl:table-cell">{v.photoCount}</td>
              <td className="px-3 py-3.5">
                <AiCount visit={v} />
              </td>
              <td className="px-3 py-3.5">
                <VisitStatusBadge status={v.status} />
              </td>
              <td className="pr-4 text-gray-400">
                <MdChevronRight className="size-5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-gray-100 md:hidden">
        {visits.map((v) => (
          <li key={v.id}>
            <Link to={`/admin/visits/${v.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-brand-50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{v.schoolName}</p>
                <p className="truncate text-xs text-gray-500">
                  {v.cityName} · {formatDate(v.date)} · {v.staffName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm">
                <AiCount visit={v} />
                <VisitStatusBadge status={v.status} />
              </div>
              <MdChevronRight className="size-5 shrink-0 text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
