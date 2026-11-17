import { api, fileUrl } from './client'

// Server: Staff/visit.php (see docs/SERVER_API.md → Staff · Visits)
// Staff only ever get their own visits; admins get everyone's.
const VISITS = '/Staff/visit.php'
const PAGE_LIMIT = 100 // server max per page

// "2026-11-17 11:45:10" (server time, IST) → "2026-11-17T11:45:10"
const toDate = (s) => (s ? s.replace(' ', 'T') : null)

// Server visit → app visit (same shape the pages already use)
function toVisit(v) {
  const normal = (v.Normal_Photos ?? []).map((p) => ({ id: `n${p.Photo_ID}`, type: 'normal', url: fileUrl(p.Path) }))
  const ai = (v.AI_Photos ?? []).map((p) => ({
    id: `a${p.Photo_ID}`,
    type: 'headcount',
    url: fileUrl(p.Path),
    ai: p.AI_Status === 'Done' ? { status: 'done', count: p.Face_Count } : { status: 'failed' },
  }))
  return {
    id: String(v.Visit_ID),
    date: v.Visit_Date,
    city: v.City,
    cityName: v.City,
    schoolName: v.School_Name,
    staffId: v.Username,
    staffName: v.Staff_Name,
    lat: v.Latitude == null ? null : Number(v.Latitude),
    lng: v.Longitude == null ? null : Number(v.Longitude),
    submittedAt: toDate(v.Created_AT),
    photos: [...normal, ...ai],
    photoCount: normal.length + ai.length,
    headcount: v.Total_Face_Count ?? null,
    aiFailed: ai.filter((p) => p.ai.status === 'failed').length,
    status: 'completed',
  }
}

// ---- cities (the server's VISIT_CITIES list, kept on the device for offline drafts) ----
const CITIES_KEY = 'cities-cache'

function rememberCities(list) {
  try {
    localStorage.setItem(CITIES_KEY, JSON.stringify(list))
  } catch {
    // storage blocked: just not cached
  }
}

export async function getCities() {
  try {
    const data = await api.get(VISITS, { params: { limit: 1 } })
    const names = data.Cities.map((c) => c.City)
    rememberCities(names)
    return names
  } catch (err) {
    try {
      const cached = JSON.parse(localStorage.getItem(CITIES_KEY))
      if (cached?.length) return cached
    } catch {
      // nothing cached
    }
    throw err
  }
}

// ---- visits ----

// All visits matching the filters, newest first. Filters: { city, dateFrom, dateTo, username }.
// ponytail: loads every page (100 per request); fine for a few thousand visits. Ask the server for
// search + stats endpoints if lists get slow.
export async function listVisits({ city, dateFrom, dateTo, username } = {}) {
  const params = { limit: PAGE_LIMIT, offset: 0 }
  if (city) params.city = city
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo
  if (username) params.username = username
  const all = []
  for (;;) {
    const data = await api.get(VISITS, { params })
    all.push(...data.Data.map(toVisit))
    params.offset += PAGE_LIMIT
    if (all.length >= data.Total || data.Data.length === 0) break
  }
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.submittedAt.localeCompare(a.submittedAt))
}

export async function getVisit(id) {
  const data = await api.get(VISITS, { params: { visit_id: id } })
  return toVisit(data.Data)
}

// Uploads a whole visit at once (multipart). The server counts faces on the AI photos while it waits,
// so this can take a minute or more. onProgress(0..1) reports the upload part.
// Returns { visit, warnings }.
export async function createVisit({ date, city, schoolName, lat, lng, normalPhotos, aiPhotos }, onProgress) {
  const form = new FormData()
  form.append('visit_date', date)
  form.append('city', city)
  form.append('school_name', schoolName)
  form.append('latitude', String(lat))
  form.append('longitude', String(lng))
  normalPhotos.forEach((blob, i) => form.append('normal_photos[]', blob, `normal-${i + 1}.jpg`))
  aiPhotos.forEach((blob, i) => form.append('ai_photos[]', blob, `headcount-${i + 1}.jpg`))
  const data = await api.post(VISITS, form, {
    timeout: 15 * 60 * 1000, // AI counting runs during the request (up to 60 s per photo)
    onUploadProgress: (e) => e.total && onProgress?.(e.loaded / e.total),
  })
  return { visit: toVisit(data.Data), warnings: data.Warnings ?? [] }
}

// Dashboard numbers for a month ("YYYY-MM"), worked out from the visit list (the server has no stats endpoint yet).
export async function getStats({ month }) {
  const [y, m] = month.split('-').map(Number)
  const dateFrom = `${month}-01`
  const dateTo = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  const weekAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-CA')
  const [visits, lastWeek] = await Promise.all([listVisits({ dateFrom, dateTo }), listVisits({ dateFrom: weekAgo })])

  const sum = (list) => list.reduce((s, v) => s + (v.headcount ?? 0), 0)
  const byCityMap = new Map()
  for (const v of visits) {
    const c = byCityMap.get(v.city) ?? { cityId: v.city, city: v.city, visits: 0, students: 0 }
    c.visits += 1
    c.students += v.headcount ?? 0
    byCityMap.set(v.city, c)
  }
  return {
    totalVisits: visits.length,
    completed: visits.length,
    students: sum(visits),
    studentsThisWeek: sum(lastWeek),
    schools: new Set(visits.map((v) => `${v.city}|${v.schoolName.trim().toLowerCase()}`)).size,
    photos: visits.reduce((s, v) => s + v.photoCount, 0),
    aiFailed: visits.filter((v) => v.aiFailed).length,
    byCity: [...byCityMap.values()].sort((a, b) => b.students - a.students),
    recent: visits.slice(0, 5),
  }
}
