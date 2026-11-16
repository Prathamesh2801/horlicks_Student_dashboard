export const PHOTO_TYPES = [
  { value: 'banner', label: 'Banner' },
  { value: 'leaflet', label: 'Leaflet' },
  { value: 'place', label: 'Place' },
  { value: 'headcount', label: 'Headcount' },
]

export const PHOTO_TYPE_LABEL = Object.fromEntries(PHOTO_TYPES.map((t) => [t.value, t.label]))

// draft = photos being added, processing = AI counting, completed = all counts back
export const VISIT_STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  processing: { label: 'AI counting', tone: 'amber' },
  completed: { label: 'Completed', tone: 'green' },
}

export const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]
