export const formatNumber = (n) => (n == null ? '—' : n.toLocaleString('en-IN'))

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export const formatCoords = (lat, lng) => (lat == null ? '—' : `${lat.toFixed(5)}, ${lng.toFixed(5)}`)

// YYYY-MM-DD in the device's local time, for <input type="date">
export const todayISO = () => new Date().toLocaleDateString('en-CA')
