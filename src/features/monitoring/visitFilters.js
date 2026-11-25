// Admin visit filters shared by Visits, Dashboard and Reports (kept in the URL by useTableState).
export const VISIT_FILTERS = { city: '', period: 'this', from: '', to: '', staff: '', ai: '', review: '' }

export const AI_FILTERS = [
  { value: 'counted', label: 'AI counted' },
  { value: 'failed', label: 'AI count failed' },
  { value: 'counting', label: 'AI counting' },
  { value: 'none', label: 'No AI photos' },
]
const aiState = (v) => (v.aiCounting ? 'counting' : v.aiFailed ? 'failed' : v.photos.some((p) => p.type === 'headcount') ? 'counted' : 'none')

// Filters applied in the browser (city + period go to the server).
export const visitMatches = (v, s) =>
  (!s.staff || v.staffName === s.staff) && (!s.ai || aiState(v) === s.ai) && (!s.review || v.review === s.review)

export const staffOptions = (visits) => [...new Set((visits ?? []).map((v) => v.staffName))].sort().map((n) => ({ value: n, label: n }))
