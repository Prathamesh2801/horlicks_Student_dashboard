// In-browser stand-in for the backend + AI service. Same function names as the real API modules.
// ponytail: localStorage caps at ~5 MB, so photos are stored as small thumbnails; fine for demos, the real API stores full files.
import cities from '../../../data/cities.json'
import { config } from '../../../config/config'
import { compressImage } from '../../../utils/compressImage'
import { authStore } from '../client'

const DB_KEY = 'mockdb-v2'
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
  jsg: [21.8554, 84.0062],
  angul: [20.8444, 85.1511],
}
const SCHOOLS = ['Govt. UP School', 'Nodal UP School', 'Govt. High School', 'Project UP School', 'Govt. Girls High School', 'Govt. ME School']
const PLACES = ['Patia', 'Mangalabag', 'Chend', 'Gosaninuagaon', 'Dhanupali', 'Baliapanda', 'Station Square', 'Bhanjpur', 'Sarbahal', 'Talcher Road']

function seed() {
  const now = Date.now()
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString()
  const user = (id, name, username, role, created, active = true) => ({
    id,
    name,
    username,
    password: role === 'admin' ? 'admin123' : 'staff123',
    role,
    active,
    createdAt: daysAgo(created),
  })
  const users = [
    user('u1', 'State Admin', 'admin', 'admin', 30),
    user('u2', 'Ravi Kumar', 'ravi.kumar', 'staff', 29),
    user('u3', 'Priya Das', 'priya.das', 'staff', 29),
    user('u4', 'Amit Sahu', 'amit.sahu', 'staff', 28),
    user('u5', 'Sneha Mishra', 'sneha.m', 'staff', 28),
    user('u6', 'Rahul Nayak', 'rahul.n', 'admin', 26),
    user('u7', 'Deepa Patra', 'deepa.p', 'staff', 25, false),
    user('u8', 'Suresh Behera', 'suresh.b', 'staff', 23),
  ]
  const staff = users.filter((u) => u.role === 'staff' && u.active)
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
      return { id: pid, type, url: null, needsHeadcount: type === 'headcount', lat, lng, takenAt: created, ai }
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

export async function listVisits({ mine, cityId, status, q, month } = {}) {
  await delay()
  const query = q?.trim().toLowerCase()
  const me = currentUser()
  return load()
    .visits.map(view)
    .filter((v) => !mine || v.staffId === me?.id)
    .filter((v) => !cityId || v.cityId === cityId)
    .filter((v) => !status || v.status === status)
    .filter((v) => !month || v.date.startsWith(month))
    .filter((v) => !query || `${v.schoolName} ${v.staffName}`.toLowerCase().includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getVisit(id) {
  await delay(150)
  return view(findVisit(load(), id))
}

export async function uploadPhoto(visitId, { file, type, lat, lng, takenAt }) {
  const thumb = await compressImage(file, 480, 0.6)
  const url = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(thumb)
  })
  const db = load()
  const photo = { id: uid(), type, url, needsHeadcount: type === 'headcount', lat, lng, takenAt, ai: null }
  findVisit(db, visitId).photos.push(photo)
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
  if (!visit.photos.some((p) => p.needsHeadcount)) return fail('Add at least one headcount photo')
  const readyAt = Date.now() + config.mockAiDelay
  visit.submittedAt = new Date().toISOString()
  visit.photos.forEach((p) => {
    if (p.needsHeadcount) p.ai = { status: 'processing', readyAt }
  })
  save(db)
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
