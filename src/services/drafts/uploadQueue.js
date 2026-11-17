import { authStore } from '../api/client'
import { createVisit } from '../api/visits.service'
import { deleteDraft, draftPhotoBlobs, listDrafts, updateDraft } from './draftStore'

// Sends submitted drafts to the server. A draft is "queued" when the user taps Submit; it is uploaded straight
// away if there is internet, otherwise automatically later: when the phone is back online, when the app is
// opened, and every minute while it is open. Android and iPhone both upload while the app is open
// (no background upload, so staff should open the app once they have signal).

const RETRY_EVERY = 60 * 1000

export const uploadEvents = new EventTarget() // 'uploaded' (detail: { draftId, visit, warnings })

// Upload one draft now. Throws on failure:
// - no internet / server unreachable → stays queued (err.offline = true) and is retried later
// - server refused it (validation etc.) → marked 'failed' with the message, back to the user to fix
export async function uploadDraft(draft, onProgress) {
  await updateDraft(draft.id, { state: 'queued', error: null })
  try {
    const blobs = await draftPhotoBlobs(draft)
    const result = await createVisit({ ...draft, ...blobs }, onProgress)
    await deleteDraft(draft.id)
    uploadEvents.dispatchEvent(new CustomEvent('uploaded', { detail: { draftId: draft.id, ...result } }))
    return result
  } catch (err) {
    if (!err.status || err.status >= 500 || err.status === 401) {
      err.offline = !err.status // no response at all
      throw err // keep it queued; retried automatically
    }
    await updateDraft(draft.id, { state: 'failed', error: err.message })
    throw err
  }
}

let running = false

// Upload every queued draft of the signed-in user, oldest first. Stops at the first network problem.
export async function uploadQueued() {
  const user = authStore.get()?.user
  if (running || !user || !navigator.onLine) return
  running = true
  try {
    const queued = (await listDrafts(user.username)).filter((d) => d.state === 'queued').reverse()
    for (const draft of queued) {
      try {
        await uploadDraft(draft)
      } catch (err) {
        if (!err.status || err.status >= 500 || err.status === 401) break
      }
    }
  } finally {
    running = false
  }
}

// Start automatic uploads (call once while a staff user is signed in). Returns a stop function.
export function startUploadQueue() {
  const tick = () => uploadQueued().catch(() => {})
  const onVisible = () => document.visibilityState === 'visible' && tick()
  window.addEventListener('online', tick)
  document.addEventListener('visibilitychange', onVisible)
  const timer = setInterval(tick, RETRY_EVERY)
  tick()
  return () => {
    window.removeEventListener('online', tick)
    document.removeEventListener('visibilitychange', onVisible)
    clearInterval(timer)
  }
}
