import { api, fileUrl } from './client'
import { notifyChange } from './pending.service'

// Server: Staff/visit.php (see docs/SERVER_API.md → Staff · Visits)
// Staff only ever get their own visits; admins get everyone's; clients get only Approved visits (no POC,
// only the normal photos an admin approved).
const VISITS = '/Staff/visit.php'
const PAGE_LIMIT = 100 // server max per page

// Visit review: server Status ↔ app review
const REVIEW_FROM = { Pending: 'waiting', Approved: 'approved', Rejected: 'rejected' }
const REVIEW_TO = { waiting: 'Pending', approved: 'Approved', rejected: 'Rejected' }
// AI photo: counted later by the server's worker (Pending → Working → Done, or Failed after retries)
const AI_FROM = { Done: 'done', Failed: 'failed' }

// "2026-11-17 11:45:10" (server time, IST) → "2026-11-17T11:45:10"
const toDate = (s) => (s ? s.replace(' ', 'T') : null)

// Server visit → app visit (same shape the pages already use)
function toVisit(v) {
  // S3 photos: the server's temporary signed link (Url). Local photos: Path via our proxy (Url is plain http).
  const photoUrl = (p) => (p.Storage === 's3' ? p.Url : fileUrl(p.Path))
  // show = the client may see it (normal photos: Is_Approved by an admin; AI photos: always). best = ★ Best (Is_Best).
  const normal = (v.Normal_Photos ?? []).map((p) => ({
    id: `n${p.Photo_ID}`,
    type: 'normal',
    url: photoUrl(p),
    show: Boolean(p.Is_Approved),
    best: Boolean(p.Is_Best),
  }))
  const ai = (v.AI_Photos ?? []).map((p) => ({
    id: `a${p.Photo_ID}`,
    type: 'headcount',
    url: photoUrl(p),
    show: true,
    ai: { status: AI_FROM[p.AI_Status] ?? 'counting', count: p.Face_Count },
  }))
  return {
    id: String(v.Visit_ID),
    date: v.Visit_Date,
    city: v.City,
    cityName: v.City,
    schoolName: v.School_Name,
    pocName: v.POC_Name ?? null, // school point of contact (never sent to clients)
    pocContact: v.POC_Contact ?? null,
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
    aiCounting: v.AI_Count_Status === 'Pending' || v.AI_Count_Status === 'Working', // counts arrive in a few minutes
    aiError: v.AI_Error ?? null, // last counting problem (admins only)
    status: 'completed',
    review: REVIEW_FROM[v.Status] ?? 'waiting', // admin review: waiting | approved | rejected
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

// Uploads a whole visit at once (multipart). The server only queues the AI photos; their counts arrive a few
// minutes later (aiCounting). onProgress(0..1) reports the upload.
// Returns { visit, warnings }.
export async function createVisit({ date, city, schoolName, pocName, pocContact, lat, lng, normalPhotos, aiPhotos }, onProgress) {
  const form = new FormData()
  form.append('visit_date', date)
  form.append('city', city)
  form.append('school_name', schoolName)
  if (pocName) form.append('poc_name', pocName)
  if (pocContact) form.append('poc_contact', pocContact)
  form.append('latitude', String(lat))
  form.append('longitude', String(lng))
  normalPhotos.forEach((blob, i) => form.append('normal_photos[]', blob, `normal-${i + 1}.jpg`))
  aiPhotos.forEach((blob, i) => form.append('ai_photos[]', blob, `headcount-${i + 1}.jpg`))
  const data = await api.post(VISITS, form, {
    timeout: 15 * 60 * 1000, // slow mobile uploads of up to 30 photos
    onUploadProgress: (e) => e.total && onProgress?.(e.loaded / e.total),
  })
  return { visit: toVisit(data.Data), warnings: data.Warnings ?? [] }
}

// ---- admin review (PUT Staff/visit.php, admins only) ----

const photoNumber = (id) => Number(id.slice(1)) // 'n31' → 31

// status: 'waiting' | 'approved' | 'rejected'
export async function reviewVisit(visitId, status) {
  await api.put(VISITS, { visit_id: Number(visitId), status: REVIEW_TO[status] })
  notifyChange()
}

// ponytail: one request per visit; ask the server for a bulk update if admins approve hundreds at once.
export async function reviewVisits(visitIds, status, onProgress) {
  for (const [i, id] of visitIds.entries()) {
    await api.put(VISITS, { visit_id: Number(id), status: REVIEW_TO[status] })
    onProgress?.(i + 1)
  }
  notifyChange()
}

// Complete lists of this visit's normal photos the client may see, and the ★ Best ones (best must also be shown).
export async function setClientPhotos(visitId, showIds, bestIds) {
  await api.put(VISITS, {
    visit_id: Number(visitId),
    approved_normal_photo_ids: showIds.map(photoNumber),
    best_normal_photo_ids: bestIds.map(photoNumber),
  })
  notifyChange()
}

// AI count failed after the server's retries: queue it again.
export async function retryAiCount(visitId) {
  await api.put(VISITS, { visit_id: Number(visitId), retry_ai_count: true })
  notifyChange()
}
