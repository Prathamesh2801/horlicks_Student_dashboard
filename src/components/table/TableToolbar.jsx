import { useRef, useState } from 'react'
import { MdClose, MdFilterAltOff, MdRefresh, MdSearch } from 'react-icons/md'
import { Button, Input, Select } from '../ui'

const SEARCH_DELAY = 250 // ms after the last keystroke before the list (and URL) updates

// Search box + filter selects (children) + refresh, with "Clear filters" and a phone-only sort menu.
// hideSearch: filters only (e.g. the dashboard).
//   sortOptions: [{ value: '-date', label: 'Newest first' }, ...] for phones (no column headers there)
export default function TableToolbar({ table, placeholder = 'Search', hideSearch, onRefresh, refreshing, sortOptions, children }) {
  // What's typed but not yet applied, so fast typing never loses characters.
  const [draft, setDraft] = useState(null)
  const timer = useRef(null)
  const search = (text) => {
    setDraft(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      table.set({ q: text })
      setDraft(null)
    }, SEARCH_DELAY)
  }
  const clearSearch = () => {
    clearTimeout(timer.current)
    setDraft(null)
    table.set({ q: '' })
  }
  const value = draft ?? table.state.q

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!hideSearch && (
          <Input
            className="min-w-0 flex-[1_1_14rem]"
            icon={MdSearch}
            type="search"
            enterKeyHint="search"
            placeholder={placeholder}
            aria-label={placeholder}
            value={value}
            onChange={(e) => search(e.target.value)}
            suffix={
              value && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <MdClose className="size-4" />
                </button>
              )
            }
          />
        )}
        {onRefresh && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh"
            className="shrink-0 sm:order-last"
          >
            <MdRefresh className={`size-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
        {/* phones: filters on their own row; larger screens: inline */}
        <div className="flex w-full flex-wrap gap-2 sm:contents">{children}</div>
      </div>
      {(table.isFiltered || sortOptions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {table.isFiltered ? (
            <button
              type="button"
              onClick={() => {
                clearTimeout(timer.current)
                setDraft(null)
                table.reset()
              }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              <MdFilterAltOff className="size-4" /> Clear filters
            </button>
          ) : (
            <span />
          )}
          {sortOptions && (
            <Select
              className="md:hidden"
              aria-label="Sort by"
              value={table.state.sort}
              onChange={(e) => table.set({ sort: e.target.value })}
              options={sortOptions}
            />
          )}
        </div>
      )}
    </div>
  )
}
