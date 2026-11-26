import { idb, keepDataOnDevice } from '../../utils/idb'

// Visits being built on the phone, before they are uploaded. Everything works offline.
// Draft: { id, username, staffName, date, city, schoolName, pocName, pocContact, lat, lng, accuracy, startedAt (form opened), createdAt, photos: [{ id, type, lat, lng, takenAt }],
//          state: 'draft' | 'queued' (submitted, waiting for internet) | 'failed' (server refused, see error), error }
// Photo images are stored separately (photos store) so lists stay fast.

const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))

// Tell screens a draft changed (added photo, queued, uploaded...).
export const draftEvents = new EventTarget()
const changed = () => draftEvents.dispatchEvent(new Event('change'))

const readDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export async function createDraft({ user, date, city, schoolName, pocName, pocContact, lat, lng, accuracy, startedAt }) {
  keepDataOnDevice()
  const draft = {
    id: uid(),
    username: user.username,
    staffName: user.name,
    date,
    city,
    schoolName,
    pocName,
    pocContact,
    lat,
    lng,
    accuracy,
    startedAt,
    createdAt: new Date().toISOString(),
    photos: [],
    state: 'draft',
    error: null,
  }
  await idb.put('drafts', draft)
  changed()
  return draft
}

// The user's drafts, newest first (each user only sees their own on a shared phone).
export async function listDrafts(username) {
  const all = await idb.getAll('drafts')
  return all.filter((d) => d.username === username).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// One draft with its photo images (data URLs) for display.
export async function getDraft(id) {
  const draft = await idb.get('drafts', id)
  if (!draft) return null
  const photos = await Promise.all(draft.photos.map(async (p) => ({ ...p, url: (await idb.get('photos', p.id))?.dataUrl ?? null })))
  return { ...draft, photos }
}

// file: the compressed JPEG from the camera/upload.
export async function addPhoto(draftId, { file, type, lat, lng }) {
  const draft = await idb.get('drafts', draftId)
  const photo = { id: uid(), type, lat, lng, takenAt: new Date().toISOString() }
  await idb.put('photos', { id: photo.id, dataUrl: await readDataUrl(file) })
  draft.photos.push(photo)
  if (draft.state === 'failed') Object.assign(draft, { state: 'draft', error: null })
  await idb.put('drafts', draft)
  changed()
  return photo
}

export async function deletePhoto(draftId, photoId) {
  const draft = await idb.get('drafts', draftId)
  draft.photos = draft.photos.filter((p) => p.id !== photoId)
  if (draft.state === 'failed') Object.assign(draft, { state: 'draft', error: null })
  await idb.put('drafts', draft)
  await idb.delete('photos', photoId)
  changed()
}

export async function updateDraft(id, changes) {
  const draft = await idb.get('drafts', id)
  if (!draft) return
  await idb.put('drafts', { ...draft, ...changes })
  changed()
}

// Removes the draft and its photos (after upload, or when the user discards it).
export async function deleteDraft(id) {
  const draft = await idb.get('drafts', id)
  if (!draft) return
  for (const p of draft.photos) await idb.delete('photos', p.id)
  await idb.delete('drafts', id)
  changed()
}

// Photo files of a draft, ready to upload.
export async function draftPhotoBlobs(draft) {
  const blob = async (p) => (await fetch((await idb.get('photos', p.id)).dataUrl)).blob()
  return {
    normalPhotos: await Promise.all(draft.photos.filter((p) => p.type === 'normal').map(blob)),
    aiPhotos: await Promise.all(draft.photos.filter((p) => p.type === 'headcount').map(blob)),
  }
}
