import { monthISO } from '../utils/format'

// normal = banner, leaflet, marketing and other activity photos. headcount = class photos the AI counts.
export const PHOTO_TYPES = [
  { value: 'normal', label: 'Normal photos' },
  { value: 'headcount', label: 'Headcount · AI' },
]

// Normal photos: the Ground Team picks one of these before taking the photo (client, 26 Nov).
export const PHOTO_CATEGORIES = ['Reporting', 'Collateral', 'Activity', 'Gratification', 'Sample Distribution', 'Closing']

// Photos per visit, per type (client's rule). The server must allow the same (see docs/SERVER_API.md).
export const MAX_PHOTOS = { normal: 20, headcount: 10 }

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
  { value: 'custom', label: 'Date range…' },
]

// Period → server date range. custom = from/to (YYYY-MM-DD), either may be empty.
export function periodRange(period, from = '', to = '') {
  if (period === 'all') return {}
  if (period === 'custom') return { ...(from && { dateFrom: from }), ...(to && { dateTo: to }) }
  const month = monthISO(period === 'last' ? -1 : 0)
  const [y, m] = month.split('-').map(Number)
  return { dateFrom: `${month}-01`, dateTo: `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}` }
}

export const ROLES = [
  { value: 'staff', label: 'Ground Team' },
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Client' },
]

// Admin review of an uploaded visit. Only approved visits reach the client and report links.
export const REVIEW = {
  waiting: { label: 'Waiting', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}
export const REVIEW_FILTERS = Object.entries(REVIEW).map(([value, r]) => ({ value, label: r.label }))

// Visit form dropdowns (revised scope v2, confirmed by the client 26 Nov).
export const SCHOOL_TYPES = ['Government', 'Private'].map((v) => ({ value: v, label: v }))
export const CLASS_CATEGORIES = ['1–3', '4–6', '7–9'].map((v) => ({ value: v, label: v }))

// Districts sent by the client (26 Nov). The form uses the server's list (Districts) and falls back to this one.
// prettier-ignore
export const DISTRICTS = ['ANUGUL', 'BALANGIR', 'BARGARH', 'BAUDH', 'DHENKANAL', 'GAJAPATI', 'GANJAM', 'JHARSUGUDA', 'KALAHANDI', 'KANDHAMAL',
  'KENDUJHAR', 'KORAPUT', 'MALKANGIRI', 'MAYURBHANJ', 'NABARANGAPUR', 'NUAPADA', 'RAYAGADA', 'SUBARNAPUR', 'SUNDARGARH']
