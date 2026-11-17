// On-device visits for the screens the server doesn't cover yet (visits, photos, AI headcount, dashboard).
// Stored in IndexedDB on this device, so drafts and full-quality photos keep working offline.
// No users or passwords live here: login and users come from the server.
import cities from '../../../data/cities.json'
import { config } from '../../../config/config'
import { idb, keepDataOnDevice } from '../../../utils/idb'
import { authStore } from '../client'

const OLD_LOCALSTORAGE_KEY = 'mockdb-v3' // previous version kept visits in localStorage; moved over once

// Older versions also stored demo users with passwords: remove them.
try {
  localStorage.removeItem('mockdb-v1')
  localStorage.removeItem('mockdb-v2')
  localStorage.removeItem('auth')
} catch {
  // storage blocked: nothing to clean
}
const cityById = Object.fromEntries(cities.map((c) => [c.id, c]))
const uid = () => Math.random().toString(36).slice(2, 10)
const fail = (message) => Promise.reject(new Error(message))

// Fake AI: a stable count per photo so reloads show the same number.
const fakeCount = (id) => 20 + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 26)

const SEED_COORDS = {
  bbsr: [20.2961, 85.8245],
  ctc: [20.4625, 85.883],
  rkl: [22.2604, 84.8536],
  bam: [19.3149, 84.7941],
  sbp: [21.4669, 83.9812],
  puri: [19.8135, 85.8312],
  bls: [21.4942, 86.9317],
  bpd: [21.9347, 86.7337],
  jsg: [21.8554, 84.0062],
  angul: [20.8444, 85.1511],
}
const SCHOOLS = ['Govt. UP School', 'Nodal UP School', 'Govt. High School', 'Project UP School', 'Govt. Girls High School', 'Govt. ME School']
const PLACES = ['Patia', 'Mangalabag', 'Chend', 'Gosaninuagaon', 'Dhanupali', 'Baliapanda', 'Station Square', 'Bhanjpur', 'Sarbahal', 'Talcher Road']

function seed() {
  const now = Date.now()
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString()
  // Sample staff names for the sample visits only (not logins).
  const staff = ['Ravi Kumar', 'Priya Das', 'Amit Sahu', 'Sneha Mishra', 'Suresh Behera'].map((name, i) => ({ id: `sample${i}`, name }))
  const cityIds = Object.keys(SEED_COORDS)

  const visits = Array.from({ length: 30 }, (_, i) => {
    const cityId = cityIds[(i * 7) % cityIds.length]
    const [lat, lng] = SEED_COORDS[cityId]
    const s = staff[i % staff.length]
    const created = daysAgo(Math.floor(i * 1.2))
    const status = i === 0 ? 'processing' : i === 5 ? 'draft' : 'completed'
    const id = `seed${i}`
    const types = [...Array(status === 'draft' ? 4 : 6 + (i % 5)).fill('normal'), ...Array(status === 'draft' ? 0 : 3).fill('headcount')]
    const photos = types.map((type, j) => {
      const pid = `${id}p${j}`
      const ai = type !== 'headcount' ? null : status === 'processing' ? { status: 'processing', readyAt: now + 45000 } : { status: 'done', count: fakeCount(pid) }
      return { id: pid, type, hasImage: false, needsHeadcount: type === 'headcount', lat, lng, takenAt: created, ai }
    })
    return {
      id,
      date: created.slice(0, 10),
      cityId,
      schoolName: `${SCHOOLS[i % SCHOOLS.length]}, ${PLACES[(i * 3) % PLACES.length]}`,
      lat: lat + 0.03 * ((i % 5) - 2),
      lng: lng + 0.03 * ((i % 3) - 1),
      accuracy: 8 + (i % 10),
      staffId: s.id,
      staffName: s.name,
      createdAt: created,
      submittedAt: status === 'draft' ? null : created,
      photos,
    }
  })
  return { visits }
}

const readDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

// All visits on this device (photo images are stored separately, see attachImages).
let ready
async function allVisits() {
  ready ??= (async () => {
    // One-time move from the old localStorage store (photos there were small inline thumbnails).
    let old = null
    try {
      old = JSON.parse(localStorage.getItem(OLD_LOCALSTORAGE_KEY))
    } catch {
      // unreadable: ignore
    }
    if (old?.visits) {
      for (const v of old.visits) {
        for (const p of v.photos) {
          if (p.url) await idb.put('photos', { id: p.id, dataUrl: p.url })
          p.hasImage = Boolean(p.url)
          delete p.url
        }
        await idb.put('visits', v)
      }
      localStorage.removeItem(OLD_LOCALSTORAGE_KEY)
    }
    if ((await idb.getAll('visits')).length === 0) for (const v of seed().visits) await idb.put('visits', v)
  })()
  await ready
  return idb.getAll('visits')
}

async function findVisit(id) {
  await allVisits()
  const visit = await idb.get('visits', id)
  if (!visit) throw new Error('Visit not found')
  return visit
}

// Photo images are only loaded for a single visit, so lists stay fast.
async function attachImages(visit) {
  const photos = await Promise.all(
    visit.photos.map(async (p) => (p.hasImage ? { ...p, url: (await idb.get('photos', p.id))?.dataUrl ?? null } : p)),
  )
  return { ...visit, photos }
}

const currentUser = () => authStore.get()?.user

// Adds the derived fields the real API will return: status, headcount, photoCount, city info.
function view(v) {
  const now = Date.now()
  const photos = v.photos.map((p) =>
    p.ai?.status === 'processing' && p.ai.readyAt <= now ? { ...p, ai: { status: 'done', count: fakeCount(p.id) } } : p,
  )
  const counts = photos.filter((p) => p.ai?.status === 'done').map((p) => p.ai.count)
  const processing = photos.some((p) => p.ai?.status === 'processing')
  const city = cityById[v.cityId]
  return {
    ...v,
    photos,
    status: !v.submittedAt ? 'draft' : processing ? 'processing' : 'completed',
    cityName: city?.name,
    district: city?.district,
    photoCount: photos.length,
    // Same children appear in several photos, so the visit count is the highest single-photo count.
    headcount: counts.length ? Math.max(...counts) : null,
  }
}

// ---- visits ----
export async function createVisit({ date, cityId, schoolName, lat, lng, accuracy }) {
  keepDataOnDevice()
  const me = currentUser()
  const visit = {
    id: uid(),
    date,
    cityId,
    schoolName,
    lat,
    lng,
    accuracy,
    staffId: me.username,
    staffName: me.name,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    photos: [],
  }
  await idb.put('visits', visit)
  return view(visit)
}

export async function listVisits({ mine, cityId, status, q, month } = {}) {
  const query = q?.trim().toLowerCase()
  const me = currentUser()
  return (await allVisits())
    .map(view)
    .filter((v) => !mine || v.staffId === me?.username)
    .filter((v) => !cityId || v.cityId === cityId)
    .filter((v) => !status || v.status === status)
    .filter((v) => !month || v.date.startsWith(month))
    .filter((v) => !query || `${v.schoolName} ${v.staffName}`.toLowerCase().includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getVisit(id) {
  return view(await attachImages(await findVisit(id)))
}

// file is already compressed by the photo page (max 1600 px JPEG), so it is stored as-is.
export async function uploadPhoto(visitId, { file, type, lat, lng, takenAt }) {
  const visit = await findVisit(visitId)
  const photo = { id: uid(), type, hasImage: true, needsHeadcount: type === 'headcount', lat, lng, takenAt, ai: null }
  await idb.put('photos', { id: photo.id, dataUrl: await readDataUrl(file) })
  visit.photos.push(photo)
  await idb.put('visits', visit)
  return photo
}

export async function deletePhoto(visitId, photoId) {
  const visit = await findVisit(visitId)
  visit.photos = visit.photos.filter((p) => p.id !== photoId)
  await idb.put('visits', visit)
  await idb.delete('photos', photoId)
}

export async function submitVisit(id) {
  const visit = await findVisit(id)
  if (!visit.photos.some((p) => p.needsHeadcount)) return fail('Add at least one headcount photo')
  const readyAt = Date.now() + config.mockAiDelay
  visit.submittedAt = new Date().toISOString()
  visit.photos.forEach((p) => {
    if (p.needsHeadcount) p.ai = { status: 'processing', readyAt }
  })
  await idb.put('visits', visit)
  return view(visit)
}

export async function getStats({ month } = {}) {
  const all = await listVisits()
  const visits = all.filter((v) => !month || v.date.startsWith(month))
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const sumHeadcount = (list) => list.reduce((s, v) => s + (v.headcount ?? 0), 0)
  const byCity = cities
    .map((c) => {
      const list = visits.filter((v) => v.cityId === c.id)
      return { cityId: c.id, city: c.name, district: c.district, visits: list.length, students: sumHeadcount(list) }
    })
    .filter((c) => c.visits)
    .sort((a, b) => b.students - a.students)
  return {
    totalVisits: visits.length,
    completed: visits.filter((v) => v.status === 'completed').length,
    processing: visits.filter((v) => v.status === 'processing').length,
    schools: new Set(visits.map((v) => `${v.cityId}|${v.schoolName.toLowerCase()}`)).size,
    students: sumHeadcount(visits),
    studentsThisWeek: sumHeadcount(all.filter((v) => v.date >= weekAgo)),
    photos: visits.reduce((s, v) => s + v.photoCount, 0),
    byCity,
    recent: visits.slice(0, 5),
  }
}
