// What the server doesn't have yet: the ★ Best photo flag. It is saved in this browser (localStorage),
// so it only exists on this device. When the server adds it (e.g. Is_Best on normal photos), set it with the
// visit's PUT and delete this file. Everything else (review, photo approval, targets) is on the server.

const KEY = 'pending-v1'

function readBest() {
  try {
    return JSON.parse(localStorage.getItem(KEY))?.photos ?? {}
  } catch {
    return {}
  }
}

// Screens listen to this to refresh after a change made here or on the server (visits.service calls notifyChange).
export const pendingEvents = new EventTarget()
export const notifyChange = () => pendingEvents.dispatchEvent(new Event('change'))
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => e.key === KEY && notifyChange())

export const SAVED_LOCALLY = '★ Best is saved on this device until the server supports it.'

export async function setPhotoBest(photoId, best) {
  const photos = readBest()
  photos[photoId] = { best }
  localStorage.setItem(KEY, JSON.stringify({ photos }))
  notifyChange()
}

// Adds the ★ Best flag to visits from the server (only for photos the client may see).
export function withPending(visits) {
  const best = readBest()
  const one = (v) => ({ ...v, photos: v.photos.map((p) => ({ ...p, best: p.show && Boolean(best[p.id]?.best) })) })
  return Array.isArray(visits) ? visits.map(one) : one(visits)
}
