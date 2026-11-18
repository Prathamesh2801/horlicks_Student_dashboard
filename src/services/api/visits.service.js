import { api, fileUrl } from './client'

// Server: Staff/visit.php (see docs/SERVER_API.md → Staff · Visits)
// Staff only ever get their own visits; admins get everyone's.
const VISITS = '/Staff/visit.php'
const PAGE_LIMIT = 100 // server max per page

// "2026-11-17 11:45:10" (server time, IST) → "2026-11-17T11:45:10"
const toDate = (s) => (s ? s.replace(' ', 'T') : null)

// Server visit → app visit (same shape the pages already use)
function toVisit(v) {
  // S3 photos: the server's temporary signed link (Url). Local photos: Path via our proxy (Url is plain http).
  const photoUrl = (p) => (p.Storage === 's3' ? p.Url : fileUrl(p.Path))
  const normal = (v.Normal_Photos ?? []).map((p) => ({ id: `n${p.Photo_ID}`, type: 'normal', url: photoUrl(p) }))
  const ai = (v.AI_Photos ?? []).map((p) => ({
    id: `a${p.Photo_ID}`,
    type: 'headcount',
    url: photoUrl(p),
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
    // Main number: each child once, even when they're in several class photos (older visits: face total).
    headcount: v.Unique_Person_Count ?? v.Total_Face_Count ?? null,
    facesSeen: v.Total_Face_Count ?? null, // faces in all AI photos added up, repeats included
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

// Admin dashboard for a month ("YYYY-MM"): one call to Admin/dashboard.php (admins only).
export async function getStats({ month }) {
  const data = await api.get('/Admin/dashboard.php', { params: { month } })
  const byCity = data.Cities.map((c) => ({ city: c.City, visits: c.This_Month_Visits, allTime: c.Total_Visits }))
  return {
    month: data.Month,
    visits: data.Total_Visits,
    students: data.Total_Unique_Person_Count ?? null, // unique students
    facesSeen: data.Total_Face_Count, // all faces, repeats included
    allTimeVisits: byCity.reduce((s, c) => s + c.allTime, 0),
    activeCities: byCity.filter((c) => c.visits).length,
    byCity: byCity.sort((a, b) => b.visits - a.visits || b.allTime - a.allTime),
    recent: data.Recent_Visits.map(toVisit),
  }
}
