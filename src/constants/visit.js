import { monthISO } from '../utils/format'

// normal = banner, leaflet, marketing and other activity photos. headcount = class photos the AI counts.
export const PHOTO_TYPES = [
  { value: 'normal', label: 'Normal photos' },
  { value: 'headcount', label: 'Headcount · AI' },
]

// Server limit per photo type (MAX_PHOTOS_PER_TYPE in the server .env).
export const MAX_PHOTOS_PER_TYPE = 10

// draft / queued / failed = on the phone only; completed = uploaded to the server (AI count done).
export const VISIT_STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  queued: { label: 'Waiting to upload', tone: 'amber' },
  failed: { label: 'Needs a fix', tone: 'red' },
  completed: { label: 'Completed', tone: 'green' },
}

// Map pin colours
export const PIN_COLOR = { counted: '#16a34a', aiFailed: '#f5b82e' }

// Visits list period filter → server date range
export const PERIODS = [
  { value: 'this', label: 'This month' },
  { value: 'last', label: 'Last month' },
  { value: 'all', label: 'All time' },
]

export function periodRange(period) {
  if (period === 'all') return {}
  const month = monthISO(period === 'last' ? -1 : 0)
  const [y, m] = month.split('-').map(Number)
  return { dateFrom: `${month}-01`, dateTo: `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}` }
}

export const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]
