import { Link, useNavigate } from 'react-router'
import { MdChevronRight } from 'react-icons/md'
import { SortHeader } from '../../../components/table'
import { Badge } from '../../../components/ui'
import { REVIEW } from '../../../constants/visit'
import { formatDate, formatNumber, formatShortDate } from '../../../utils/format'

function AiCount({ visit }) {
  if (visit.aiCounting) return <span className="text-gray-400">Counting…</span>
  if (visit.headcount == null && visit.aiFailed) return <span className="font-semibold text-amber-600">—</span>
  return (
    <span className="font-bold">
      {formatNumber(visit.headcount)}
      {visit.facesSeen > visit.headcount && (
        <span className="block text-xs font-normal text-gray-500">{formatNumber(visit.facesSeen)} faces</span>
      )}
    </span>
  )
}

function AiBadge({ visit }) {
  const ai = visit.photos.filter((p) => p.type === 'headcount').length
  if (!ai) return <Badge>No AI photos</Badge>
  if (visit.aiCounting) return <Badge tone="brand">Counting</Badge>
  if (visit.aiFailed) return <Badge tone="amber">{visit.aiFailed} failed</Badge>
  return <Badge tone="green">Counted</Badge>
}

const ReviewBadge = ({ visit }) => <Badge tone={REVIEW[visit.review]?.tone}>{REVIEW[visit.review]?.label}</Badge>

// Table on tablet/desktop, compact list on phones. Render inside a Card.
// table (optional): useTableState() result, makes the headers sortable.
export default function VisitsTable({ visits, table }) {
  const navigate = useNavigate()
  const open = (v) => navigate(`/admin/visits/${v.id}`)
  const h = (label, field, className, firstDesc) => <SortHeader label={label} field={field} table={table} className={className} firstDesc={firstDesc} />

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            {h('Date', 'date', 'px-5 py-3', true)}
            {h('School', 'school')}
            {h('City', 'city')}
            {h('Ground Team', 'staff', 'hidden px-3 py-3 lg:table-cell')}
            {h('Photos', 'photos', 'hidden px-3 py-3 xl:table-cell', true)}
            {h('Review', 'review')}
            {h('Students', 'count', undefined, true)}
            {h('AI', 'ai', undefined, true)}
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
                <ReviewBadge visit={v} />
              </td>
              <td className="px-3 py-3.5">
                <AiCount visit={v} />
              </td>
              <td className="px-3 py-3.5">
                <AiBadge visit={v} />
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
                <ReviewBadge visit={v} />
              </div>
              <MdChevronRight className="size-5 shrink-0 text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
