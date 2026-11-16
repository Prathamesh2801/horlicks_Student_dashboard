export const formatNumber = (n) => (n == null ? '—' : n.toLocaleString('en-IN'))

// 24800 -> "24.8k"
export const formatCompact = (n) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0).toLowerCase()

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatShortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'

export const formatCoords = (lat, lng) => (lat == null ? '—' : `${lat.toFixed(5)}, ${lng.toFixed(5)}`)

export const mapUrl = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

// YYYY-MM-DD in the device's local time, for <input type="date">
export const todayISO = () => new Date().toLocaleDateString('en-CA')

// YYYY-MM, offset in months from the current one (-1 = last month)
export const monthISO = (offset = 0) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString('en-CA').slice(0, 7)
}

export const formatMonth = (ym) =>
  ym ? new Date(`${ym}-01T00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'all time'
