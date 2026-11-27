import { PeriodFilter, TableToolbar } from '../../components/table'
import { Select } from '../../components/ui'

// Date range + city (+ optional extra filters as children) for the client pages. search = show the search box.
export default function ClientFilters({ table, cities, onRefresh, refreshing, search, children }) {
  return (
    <TableToolbar table={table} hideSearch={!search} placeholder="Search school or district" onRefresh={onRefresh} refreshing={refreshing}>
      <PeriodFilter table={table} />
      <Select
        className="w-full sm:w-44"
        aria-label="District"
        placeholder="All districts"
        value={table.state.city}
        onChange={(e) => table.set({ city: e.target.value })}
        options={cities.map((c) => ({ value: c, label: c }))}
      />
      {children}
    </TableToolbar>
  )
}
