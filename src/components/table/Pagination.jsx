import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { formatNumber } from '../../utils/format'
import { PAGE_SIZES } from './useTableState'

// [1, '…', 4, 5, 6, '…', 20]
function pageList(page, count) {
  const pages = [...new Set([1, page - 1, page, page + 1, count])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  return pages.flatMap((n, i) => (i && n - pages[i - 1] > 1 ? ['…', n] : [n]))
}

function PageButton({ active, label, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition disabled:opacity-40 ${
        active ? 'bg-brand-700 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// "Showing 11–20 of 240", rows-per-page and page buttons.
export default function Pagination({ table, noun = 'rows' }) {
  const { page, pageCount, pageSize, total } = table
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)} {total === 1 ? noun.replace(/s$/, '') : noun}
        </span>
        <label className="hidden items-center gap-1.5 sm:flex">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => table.set({ size: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 outline-none focus:border-brand-700"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      {pageCount > 1 && (
        <nav className="flex items-center gap-1.5" aria-label="Pages">
          <PageButton onClick={() => table.set({ page: page - 1 })} disabled={page === 1} label="Previous page">
            <MdChevronLeft className="size-5" />
          </PageButton>
          {pageList(page, pageCount).map((n, i) =>
            n === '…' ? (
              <span key={`gap${i}`} className="hidden px-1 text-gray-400 sm:inline">
                …
              </span>
            ) : (
              <PageButton
                key={n}
                onClick={() => table.set({ page: n })}
                active={n === page}
                label={`Page ${n}`}
                // phones: only current page + arrows
                className={n === page ? '' : 'max-sm:hidden'}
              >
                {n}
              </PageButton>
            ),
          )}
          <PageButton onClick={() => table.set({ page: page + 1 })} disabled={page === pageCount} label="Next page">
            <MdChevronRight className="size-5" />
          </PageButton>
        </nav>
      )}
    </div>
  )
}
