import { MdArrowDownward, MdArrowUpward, MdUnfoldMore } from 'react-icons/md'

// Column header that sorts on click: ↕ unsorted, ↑ ascending, ↓ descending.
// Without `table` (or `field`) it renders a plain header. firstDesc: first click sorts high→low (dates, counts).
export default function SortHeader({ label, field, table, firstDesc, className = 'px-3 py-3' }) {
  if (!table || !field) return <th className={className}>{label}</th>
  const active = table.sortKey === field
  const Icon = !active ? MdUnfoldMore : table.desc ? MdArrowDownward : MdArrowUpward
  return (
    <th className={className} aria-sort={active ? (table.desc ? 'descending' : 'ascending') : 'none'}>
      <button
        type="button"
        onClick={() => table.toggleSort(field, firstDesc)}
        className={`group -mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wide transition hover:text-gray-900 ${active ? 'text-brand-700' : ''}`}
        title={`Sort by ${label}`}
      >
        {label}
        <Icon className={`size-4 shrink-0 ${active ? 'text-brand-700' : 'text-gray-300 group-hover:text-gray-500'}`} />
      </button>
    </th>
  )
}
