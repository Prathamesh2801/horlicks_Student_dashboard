import { useSearchParams } from 'react-router'

export const PAGE_SIZES = [10, 25, 50, 100]
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const empty = (v) => v == null || v === ''

// Search + filter + sort + paging for a list already loaded in the browser.
// State lives in the URL (?q=&sort=-date&page=2&size=25&<filters>) so Back returns to the same view.
//   rows:       the full list (null while loading)
//   filters:    { key: defaultValue } extra URL filters (e.g. { role: '' })
//   defaultSort: 'field' or '-field' (descending)
//   sortValue:  { field: (row) => value } for sortable columns
//   searchText: (row) => text searched by the search box
//   matches:    (row, state) => boolean for the extra filters
// ponytail: filters/sorts the whole list on every render; fine for a few thousand rows.
export function useTableState({ rows, filters = {}, defaultSort = '', sortValue = {}, searchText, matches }) {
  const [params, setParams] = useSearchParams()
  const defaults = { q: '', sort: defaultSort, page: '1', size: String(PAGE_SIZES[0]), ...filters }
  const state = Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d]))

  // Change state; anything but the page itself sends you back to page 1.
  const set = (patch) => {
    const next = { ...state, ...('page' in patch ? {} : { page: '1' }), ...patch }
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => !empty(v) && String(v) !== String(defaults[k]))), {
      replace: true,
    })
  }

  const desc = state.sort.startsWith('-')
  const sortKey = state.sort.replace(/^-/, '')
  const toggleSort = (key, firstDesc = false) =>
    set({ sort: sortKey === key ? (desc ? key : `-${key}`) : firstDesc ? `-${key}` : key })

  let list = null
  if (rows) {
    const q = state.q.trim().toLowerCase()
    list = rows.filter((r) => (!q || searchText(r).toLowerCase().includes(q)) && (!matches || matches(r, state)))
    const get = sortValue[sortKey]
    if (get) {
      list = [...list].sort((a, b) => {
        const x = get(a)
        const y = get(b)
        if (empty(x) || empty(y)) return empty(x) - empty(y) // empty values always last
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))
        return desc ? -c : c
      })
    }
  }

  const size = PAGE_SIZES.includes(Number(state.size)) ? Number(state.size) : PAGE_SIZES[0]
  const total = list?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const page = Math.min(Math.max(1, Number(state.page) || 1), pageCount)

  return {
    state,
    set,
    reset: () => setParams({}, { replace: true }),
    isFiltered: Object.keys(filters).some((k) => state[k] !== defaults[k]) || state.q !== '',
    sortKey,
    desc,
    toggleSort,
    rows: list?.slice((page - 1) * size, page * size) ?? null,
    filtered: list, // all pages (e.g. for export)
    total,
    page,
    pageCount,
    pageSize: size,
  }
}
