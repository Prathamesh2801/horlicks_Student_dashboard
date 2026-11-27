import { api, fileUrl } from './client'
import { CLASS_CATEGORIES, DISTRICTS } from '../../constants/visit'
import { notifyChange } from './pending.service'

// Server: Staff/visit.php (see docs/SERVER_API.md → Staff · Visits)
// Staff only ever get their own visits; admins get everyone's; clients get only Approved visits (no POC,
// only the normal photos an admin approved).
const VISITS = '/Staff/visit.php'
const PAGE_LIMIT = 100 // server max per page
const NOT_SET = 'Not set' // old visits saved with a city only (v1.21)

// Visit review: server Status ↔ app review
const REVIEW_FROM = { Pending: 'waiting', Approved: 'approved', Rejected: 'rejected' }
const REVIEW_TO = { waiting: 'Pending', approved: 'Approved', rejected: 'Rejected' }
// AI photo: counted later by the server's worker (Pending → Working → Done, or Failed after retries)
const AI_FROM = { Done: 'done', Failed: 'failed' }
// Audit (server v1.18): Is_Audit_Pass true / false / null ↔ app approved / rejected / not audited
const COUNTS = '/Admin/visit_count.php' // admin correction of the unique student count (v1.19)
// Class category: the server stores 1, 2, 3; the client calls them 1–3, 4–6, 7–9.
const classLabel = (n) => CLASS_CATEGORIES.find((c) => c.value === String(n))?.label ?? (n == null ? null : String(n))
// Photo category → its upload key ("Sample Distribution" → sample_distribution), as in the server's Options.Photo_Category_Keys
const categoryKey = (c) => c.toLowerCase().replace(/ /g, '_')

// "2026-11-17 11:45:10" (server time, IST) → "2026-11-17T11:45:10"
const toDate = (s) => (s ? s.replace(' ', 'T') : null)

// Server visit → app visit (same shape the pages already use)
function toVisit(v) {
  // S3 photos: the server's temporary signed link (Url). Local photos: Path via our proxy (Url is plain http).
  const photoUrl = (p) => (p.Storage === 's3' ? p.Url : fileUrl(p.Path))
  const gps = (p) => (p.Latitude == null ? {} : { lat: Number(p.Latitude), lng: Number(p.Longitude) }) // photo's own GPS, if sent
  // show = the client may see it (normal photos: Is_Approved by an admin; AI photos: always). best = ★ Best (Is_Best).
  const normal = (v.Normal_Photos ?? []).map((p) => ({
    id: `n${p.Photo_ID}`,
    type: 'normal',
    url: photoUrl(p),
    ...gps(p),
    show: Boolean(p.Is_Approved),
    category: p.Category ?? null,
    best: Boolean(p.Is_Best),
  }))
  const ai = (v.AI_Photos ?? []).map((p) => ({
    id: `a${p.Photo_ID}`,
    type: 'headcount',
    url: photoUrl(p),
    ...gps(p),
    show: true,
    ai: { status: AI_FROM[p.AI_Status] ?? 'counting', count: p.Face_Count },
  }))
  return {
    id: String(v.Visit_ID),
    date: v.Visit_Date,
    // v1.21: District replaced City. The app keeps the name `city` for it (filters, charts, targets, map).
    city: v.District ?? NOT_SET,
    district: v.District ?? null,
    cityName: v.District ?? NOT_SET,
    schoolName: v.School_Name,
    village: v.Village ?? null,
    udise: v.UDISE ?? null,
    schoolType: v.School_Type ?? null,
    classCategory: classLabel(v.Class_Category),
    pocName: v.POC_Name ?? null, // school point of contact (never sent to clients)
    pocContact: v.POC_Contact ?? null,
    staffId: v.Username,
    staffName: v.Staff_Name,
    lat: v.Latitude == null ? null : Number(v.Latitude),
    lng: v.Longitude == null ? null : Number(v.Longitude),
    startTime: v.Start_Time ?? null, // HH:MM when the Ground Team opened the visit form
    submittedAt: toDate(v.Created_AT),
    photos: [...normal, ...ai],
    photoCount: normal.length + ai.length,
    // Main number: each child once, even when they're in several class photos (older visits: face total).
    headcount: v.Unique_Person_Count ?? v.Total_Face_Count ?? null,
    headcountManual: Boolean(v.Unique_Count_Manual), // an admin corrected the AI's number
    collateralCount: v.Collateral_Count ?? null, // entered by an Admin on the visit page (client feedback 27 Nov)
    facesSeen: v.Total_Face_Count ?? null, // faces in all AI photos added up, repeats included
    aiFailed: ai.filter((p) => p.ai.status === 'failed').length,
    aiCounting: v.AI_Count_Status === 'Pending' || v.AI_Count_Status === 'Working', // counts arrive in a few minutes
    aiError: v.AI_Error ?? null, // last counting problem (admins only)
    status: 'completed',
    review: REVIEW_FROM[v.Status] ?? 'waiting', // admin review: waiting | approved | rejected
    reviewedBy: v.Status_Updated_By ?? null,
    reviewedAt: toDate(v.Status_Updated_AT),
    // Auditor's verdict (null = not audited). Never sent to the Ground Team.
    audit:
      v.Is_Audit_Pass == null
        ? null
        : {
            status: v.Is_Audit_Pass ? 'approved' : 'rejected',
            remark: v.Auditor_Comment ?? '',
            by: v.Audit_Updated_By ?? null, // only Admin and Auditor get who audited
            at: toDate(v.Audit_Updated_AT),
          },
  }
}

// ---- dropdown lists from the server (kept on the device for offline drafts) ----
// The visit list response carries Districts (with visit counts) and Options (Districts, Class_Categories, School_Types, …).
const remember = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // storage blocked: just not cached
  }
}
const cached = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? null
  } catch {
    return null
  }
}

async function serverList(key, read) {
  try {
    const list = read(await api.get(VISITS, { params: { limit: 1 } }))
    if (list.length) remember(key, list)
    return list
  } catch (err) {
    if (cached(key)?.length) return cached(key)
    throw err
  }
}

// The programme's districts (Options.Districts). `getCities` is the same list for the app's district filters.
export const getCities = () => getDistricts()
// Offline with nothing cached: the client's list.
export const getDistricts = () =>
  serverList('districts-cache', (d) => d.Options?.Districts ?? []).then(
    (l) => (l.length ? l : DISTRICTS),
    () => cached('districts-cache') ?? DISTRICTS,
  )

// ---- visits ----

// All visits matching the filters, newest first. Filters: { city (= district), dateFrom, dateTo, username }.
// ponytail: loads every page (100 per request); fine for a few thousand visits. Ask the server for
// search + stats endpoints if lists get slow.
export async function listVisits({ city, dateFrom, dateTo, username } = {}) {
  const params = { limit: PAGE_LIMIT, offset: 0 }
  if (city) params.district = city
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
export async function createVisit(
  {
    date,
    district,
    village,
    udise,
    schoolName,
    schoolType,
    classCategory,
    pocName,
    pocContact,
    lat,
    lng,
    startedAt,
    photos,
    normalPhotos,
    aiPhotos,
  },
  onProgress,
) {
  const form = new FormData()
  form.append('visit_date', date)
  form.append('school_name', schoolName)
  form.append('latitude', String(lat))
  form.append('longitude', String(lng))
  // Fields the Admin can hide or make optional (visit_form.php): sent only when filled.
  const optional = {
    district,
    village,
    udise,
    school_type: schoolType,
    class_category: CLASS_CATEGORIES.find((c) => c.label === classCategory)?.value ?? classCategory, // 1–3 → 1
    poc_name: pocName,
    poc_contact: pocContact,
    start_time:
      startedAt && new Date(startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
  }
  Object.entries(optional).forEach(([k, v]) => v && form.append(k, v))
  // Normal photos go under their category: normal_photos[reporting][] … (same order as the draft's photos).
  const normalMeta = (photos ?? []).filter((p) => p.type === 'normal')
  normalPhotos.forEach((blob, i) => {
    // Drafts from before categories have none; they go under Activity.
    const key = categoryKey(normalMeta[i]?.category ?? 'Activity')
    form.append(`normal_photos[${key}][]`, blob, `${key}-${i + 1}.jpg`)
  })
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

// ---- audit (Auditor role, server v1.18: PUT Staff/visit.php, Auditors only) ----
// Approve (pass) or reject (fail) an Approved visit with a comment; any Auditor can change it later (latest wins).
export async function saveAudit(visitId, status, remark) {
  await api.put(VISITS, { visit_id: Number(visitId), is_audit_pass: status === 'approved', auditor_comment: remark })
  notifyChange()
}

// ---- unique student count correction (Admin, server v1.19) ----
const toCountChange = (c) => ({
  id: c.Change_ID,
  from: c.From,
  to: c.To,
  reason: c.Reason ?? '',
  by: c.Changed_By,
  at: toDate(c.Changed_AT),
})

// History of corrections, newest first.
export async function getCountHistory(visitId) {
  const data = await api.get(COUNTS, { params: { visit_id: visitId } })
  return (data.Data?.History ?? []).map(toCountChange)
}

// Admin control panel: replace the AI's unique student count (the AI worker keeps it; "Count again" replaces it)
// and / or set the Collateral Count. Pass only what changed (null = leave it).
// ponytail: collateral_count is not on the server yet (docs/SERVER_API.md → Still needed).
export async function correctCount(visitId, { count, collateral, reason }) {
  await api.put(COUNTS, {
    visit_id: Number(visitId),
    ...(count == null ? {} : { unique_person_count: Number(count) }),
    ...(collateral == null ? {} : { collateral_count: Number(collateral) }),
    reason: reason || undefined,
  })
  notifyChange()
}
