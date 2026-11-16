import { monthISO } from '../utils/format'

// normal = banner, leaflet, marketing and other activity photos. headcount = class photos the AI counts.
export const PHOTO_TYPES = [
  { value: 'normal', label: 'Normal photos' },
  { value: 'headcount', label: 'Headcount · AI' },
]

// draft = photos being added, processing = AI counting, completed = all counts back
export const VISIT_STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  processing: { label: 'AI counting', tone: 'amber' },
  completed: { label: 'Completed', tone: 'green' },
}

// Map pin colours per status
export const STATUS_COLOR = { draft: '#9ca3af', processing: '#f5b82e', completed: '#16a34a' }

// Visits list period filter
export const PERIODS = [
  { value: 'this', label: 'This month' },
  { value: 'last', label: 'Last month' },
  { value: 'all', label: 'All time' },
]

export const periodMonth = (period) => (period === 'this' ? monthISO() : period === 'last' ? monthISO(-1) : '')

export const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]
