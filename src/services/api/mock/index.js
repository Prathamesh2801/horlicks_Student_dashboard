// In-browser stand-in for the backend + AI service. Same function names as the real API modules.
// ponytail: localStorage caps at ~5 MB, so photos are stored as small thumbnails; fine for demos, the real API stores full files.
import cities from '../../../data/cities.json'
import { config } from '../../../config/config'
import { compressImage } from '../../../utils/compressImage'
import { authStore } from '../client'

const DB_KEY = 'mockdb-v1'
const cityById = Object.fromEntries(cities.map((c) => [c.id, c]))
const uid = () => Math.random().toString(36).slice(2, 10)
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
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
}

function seed() {
  const createdAt = new Date().toISOString()
  const users = [
    { id: 'u1', name: 'State Admin', username: 'admin', password: 'admin123', role: 'admin', active: true, createdAt },
    { id: 'u2', name: 'Ravi Kumar', username: 'staff', password: 'staff123', role: 'staff', active: true, createdAt },
    { id: 'u3', name: 'Priya Das', username: 'priya', password: 'staff123', role: 'staff', active: true, createdAt },
  ]

  const schools = ['Govt. UP School', 'Govt. High School', 'Nodal UP School', 'Project UP School']
  const visits = Object.entries(SEED_COORDS).map(([cityId, [lat, lng]], i) => {
    const staff = users[1 + (i % 2)]
    const day = new Date(Date.now() - i * 86400000).toISOString()
    const id = `seed${i}`
    const photos = ['banner', 'leaflet', 'place', 'headcount', 'headcount', 'headcount'].map((type, j) => {
      const pid = `${id}p${j}`
      const counted = type === 'headcount'
      return {
        id: pid,
        type,
        url: null,
        needsHeadcount: counted,
        lat,
        lng,
        takenAt: day,
        ai: counted ? { status: 'done', count: fakeCount(pid) } : null,
      }
    })
    return {
      id,
      date: day.slice(0, 10),
      cityId,
      schoolName: `${schools[i % 4]}, ${cityById[cityId].name}`,
      lat: lat + 0.01 * (i % 3),
      lng: lng - 0.01 * (i % 2),
      accuracy: 12,
      staffId: staff.id,
      staffName: staff.name,
      createdAt: day,
      submittedAt: day,
      photos,
    }
  })
  return { users, visits }
}

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    throw new Error('Mock storage is full. Clear site data to reset the demo.')
  }
}

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(DB_KEY))
    if (db) return db
  } catch {
    // corrupt data: reseed below
  }
  const db = seed()
  save(db)
  return db
}

const currentUser = () => authStore.get()?.user
const publicUser = (u) => {
  const copy = { ...u }
  delete copy.password
  return copy
}

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

function findVisit(db, id) {
  const visit = db.visits.find((v) => v.id === id)
  if (!visit) throw new Error('Visit not found')
  return visit
}

// ---- auth ----
export async function login({ username, password }) {
  await delay()
  const user = load().users.find((u) => u.username === username.trim() && u.password === password)
  if (!user) return fail('Wrong username or password')
  if (!user.active) return fail('This account is disabled. Contact your admin.')
  return { token: `mock-${user.id}`, user: publicUser(user) }
}

// ---- users ----
export async function listUsers() {
  await delay()
  return load().users.map(publicUser)
}

export async function createUser({ name, username, password, role }) {
  await delay()
  const db = load()
  if (db.users.some((u) => u.username === username)) return fail('That username is already taken')
  const user = { id: uid(), name, username, password, role, active: true, createdAt: new Date().toISOString() }
  db.users.push(user)
  save(db)
  return publicUser(user)
}

export async function updateUser(id, changes) {
  await delay()
  const db = load()
  const user = db.users.find((u) => u.id === id)
  if (!user) return fail('User not found')
  Object.assign(user, changes)
  save(db)
  return publicUser(user)
}

// ---- cities ----
export async function getCities() {
  return cities
}

// ---- visits ----
export async function createVisit({ date, cityId, schoolName, lat, lng, accuracy }) {
  await delay()
  const db = load()
  const me = currentUser()
  const visit = {
    id: uid(),
    date,
    cityId,
    schoolName,
    lat,
    lng,
    accuracy,
    staffId: me.id,
    staffName: me.name,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    photos: [],
  }
  db.visits.push(visit)
  save(db)
  return view(visit)
}

export async function listVisits({ mine, cityId, status, q } = {}) {
  await delay()
  const query = q?.trim().toLowerCase()
  const me = currentUser()
  return load()
    .visits.map(view)
    .filter((v) => !mine || v.staffId === me?.id)
    .filter((v) => !cityId || v.cityId === cityId)
    .filter((v) => !status || v.status === status)
    .filter((v) => !query || `${v.schoolName} ${v.staffName}`.toLowerCase().includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getVisit(id) {
  await delay(150)
  return view(findVisit(load(), id))
}

export async function uploadPhoto(visitId, { file, type, needsHeadcount, lat, lng, takenAt }) {
  const thumb = await compressImage(file, 480, 0.6)
  const url = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(thumb)
  })
  const db = load()
  const photo = { id: uid(), type, url, needsHeadcount, lat, lng, takenAt, ai: null }
  findVisit(db, visitId).photos.push(photo)
  save(db)
  return photo
}

export async function updatePhoto(visitId, photoId, changes) {
  const db = load()
  const photo = findVisit(db, visitId).photos.find((p) => p.id === photoId)
  Object.assign(photo, changes)
  save(db)
  return photo
}

export async function deletePhoto(visitId, photoId) {
  const db = load()
  const visit = findVisit(db, visitId)
  visit.photos = visit.photos.filter((p) => p.id !== photoId)
  save(db)
}

export async function submitVisit(id) {
  await delay()
  const db = load()
  const visit = findVisit(db, id)
  const readyAt = Date.now() + config.mockAiDelay
  visit.submittedAt = new Date().toISOString()
  visit.photos.forEach((p) => {
    if (p.needsHeadcount) p.ai = { status: 'processing', readyAt }
  })
  save(db)
  return view(visit)
}

export async function getStats() {
  const visits = await listVisits()
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
    photos: visits.reduce((s, v) => s + v.photoCount, 0),
    byCity,
    recent: visits.slice(0, 5),
  }
}
