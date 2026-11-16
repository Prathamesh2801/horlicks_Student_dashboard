import { useNavigate } from 'react-router'
import { formatDate, formatNumber } from '../../../utils/format'
import { VisitStatusBadge } from '../../visits'

export default function VisitsTable({ visits }) {
  const navigate = useNavigate()
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">School</th>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">Staff</th>
            <th className="px-4 py-3 text-right">Photos</th>
            <th className="px-4 py-3 text-right">AI count</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visits.map((v) => (
            <tr
              key={v.id}
              onClick={() => navigate(`/admin/visits/${v.id}`)}
              className="cursor-pointer hover:bg-brand-50/50"
            >
              <td className="whitespace-nowrap px-4 py-3">{formatDate(v.date)}</td>
              <td className="px-4 py-3 font-medium">{v.schoolName}</td>
              <td className="px-4 py-3">{v.cityName}</td>
              <td className="px-4 py-3">{v.staffName}</td>
              <td className="px-4 py-3 text-right">{v.photoCount}</td>
              <td className="px-4 py-3 text-right font-medium">
                {v.status === 'processing' ? 'counting…' : formatNumber(v.headcount)}
              </td>
              <td className="px-4 py-3">
                <VisitStatusBadge status={v.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
