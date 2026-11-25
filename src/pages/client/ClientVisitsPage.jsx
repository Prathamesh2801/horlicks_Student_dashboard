import { Link, useNavigate } from 'react-router'
import { MdChevronRight } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, SortHeader, TableSkeleton } from '../../components/table'
import { Card } from '../../components/ui'
import { formatDate, formatNumber, formatShortDate } from '../../utils/format'
import ClientFilters from './ClientFilters'
import { useClientVisits } from './useClientVisits'

const shownPhotos = (v) => v.photos.filter((p) => p.show).length
const SORT = {
  date: (v) => v.date,
  school: (v) => v.schoolName,
  city: (v) => v.cityName,
  count: (v) => v.headcount,
  photos: shownPhotos,
}

// School visits for the client (approved only, without saying so). No Ground Team names, no review or AI details.
export default function ClientVisitsPage() {
  const navigate = useNavigate()
  const { data, error, loading, refreshing, reload, table, cities } = useClientVisits({
    defaultSort: '-date',
    sortValue: SORT,
    searchText: (v) => `${v.schoolName} ${v.cityName}`,
  })
  const open = (v) => navigate(`/client/visits/${v.id}`)
  const h = (label, field, className, firstDesc) => (
    <SortHeader label={label} field={field} table={table} className={className} firstDesc={firstDesc} />
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visits"
        subtitle={data ? `${formatNumber(table.total)} school visits · open one to see its photos` : 'School visits'}
      />
      <ClientFilters table={table} cities={cities} onRefresh={reload} refreshing={refreshing} search />
      {error && !data ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
        <Card className="overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : table.total === 0 ? (
            <NoResults onClear={table.isFiltered ? table.reset : undefined} text={table.isFiltered ? undefined : 'No school visits yet.'} />
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    {h('Date', 'date', 'px-5 py-3', true)}
                    {h('School', 'school')}
                    {h('City', 'city')}
                    {h('Students', 'count', undefined, true)}
                    {h('Photos', 'photos', undefined, true)}
                    <th className="w-10" aria-hidden="true" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.rows.map((v) => (
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
                      <td className="px-3 py-3.5 font-bold">{formatNumber(v.headcount)}</td>
                      <td className="px-3 py-3.5 text-gray-700">{shownPhotos(v)}</td>
                      <td className="pr-4 text-gray-400">
                        <MdChevronRight className="size-5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-gray-100 md:hidden">
                {table.rows.map((v) => (
                  <li key={v.id}>
                    <Link to={`/client/visits/${v.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-brand-50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{v.schoolName}</p>
                        <p className="truncate text-xs text-gray-500">
                          {v.cityName} · {formatDate(v.date)} · {shownPhotos(v)} photos
                        </p>
                      </div>
                      <span className="text-sm font-bold">{formatNumber(v.headcount)}</span>
                      <MdChevronRight className="size-5 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination table={table} noun="visits" />
            </>
          )}
        </Card>
      )}
    </div>
  )
}
