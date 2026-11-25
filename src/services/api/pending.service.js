// Features the server doesn't have yet: visit review, photo Show / ★ Best, campaign target, report links.
// Until it does, they are saved in this browser (localStorage), so they only exist on this device.
// Each function has the shape the server endpoint will have (see docs/SERVER_API.md → "Needed from the server"):
// when an endpoint is ready, replace that function's body with the api.* call and delete the local code.

const KEY = 'pending-v1'
const empty = { reviews: {}, photos: {}, target: null, reports: [] }

function read() {
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return { ...empty }
  }
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  pendingEvents.dispatchEvent(new Event('change'))
}
const update = (fn) => {
  const data = read()
  fn(data)
  write(data)
}

// Screens listen to this to refresh after a change (here or in another tab).
export const pendingEvents = new EventTarget()
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => e.key === KEY && pendingEvents.dispatchEvent(new Event('change')))

export const SAVED_LOCALLY = 'Saved on this device until the server supports it.'

// ---- visit review: 'waiting' | 'approved' | 'rejected' (future: PUT Admin/visit_review.php) ----

export async function setReview(visitId, status) {
  update((d) => {
    d.reviews[visitId] = { status, at: new Date().toISOString() }
  })
}

export async function setReviews(visitIds, status) {
  const at = new Date().toISOString()
  update((d) => visitIds.forEach((id) => (d.reviews[id] = { status, at })))
}

// ---- normal photo flags: shown to the client, ★ best (future: PUT Admin/photo_flags.php) ----
// Headcount photos are always shown with an approved visit; normal photos only when "show" is on.

export async function setPhotoFlags(photoId, flags) {
  update((d) => {
    d.photos[photoId] = { ...d.photos[photoId], ...flags }
  })
}

// Adds review + photo flags to visits from the server (future: the server sends Review_Status, Show, Best).
export function withPending(visits) {
  const { reviews, photos } = read()
  const one = (v) => ({
    ...v,
    review: reviews[v.id]?.status ?? 'waiting',
    reviewedAt: reviews[v.id]?.at ?? null,
    photos: v.photos.map((p) => {
      const f = photos[p.id] ?? {}
      return { ...p, show: p.type === 'headcount' || Boolean(f.show), best: Boolean(f.best) }
    }),
  })
  return Array.isArray(visits) ? visits.map(one) : one(visits)
}

// ---- campaign target: dates + a target (approved visits) per city (future: GET/PUT Admin/target.php) ----
// { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', cities: { [city]: number } }

export async function getTarget() {
  return read().target
}

export async function saveTarget(target) {
  update((d) => {
    d.target = target
  })
}

// ---- report links (future: Admin/report.php to manage, public report.php?id= to open) ----
// { id, title, from, to, filters: { city, staff, ai }, visitIds: [...] | null (= all approved matching), expires, active, opens, createdAt }

const newId = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4)

export async function listReports() {
  return [...read().reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createReport(report) {
  const created = { ...report, id: newId(), active: true, opens: 0, createdAt: new Date().toISOString() }
  update((d) => d.reports.push(created))
  return created
}

export async function setReportActive(id, active) {
  update((d) => {
    const r = d.reports.find((x) => x.id === id)
    if (r) r.active = active
  })
}

// Opened from the shared link: counts the open. Returns null if the link is unknown, turned off or expired.
export async function openReport(id) {
  const r = read().reports.find((x) => x.id === id)
  if (!r || !r.active || (r.expires && r.expires < new Date().toLocaleDateString('en-CA'))) return null
  update((d) => {
    const x = d.reports.find((y) => y.id === id)
    x.opens += 1
  })
  return r
}
