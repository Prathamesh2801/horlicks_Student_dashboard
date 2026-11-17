import { useCallback, useEffect, useState } from 'react'
import { draftEvents, getDraft, listDrafts } from '../../services/drafts/draftStore'

// One draft from the phone, refreshed whenever any draft changes. draft === null means it no longer exists
// (e.g. it was just uploaded).
export function useDraft(id) {
  const [draft, setDraft] = useState(undefined)
  const [error, setError] = useState(null)

  const reload = useCallback(() => getDraft(id).then(setDraft, (e) => setError(e.message)), [id])

  useEffect(() => {
    reload()
    draftEvents.addEventListener('change', reload)
    return () => draftEvents.removeEventListener('change', reload)
  }, [reload])

  return { draft, error, reload }
}

// The signed-in user's drafts on this phone, kept up to date.
export function useDrafts(username) {
  const [drafts, setDrafts] = useState(null)

  useEffect(() => {
    const load = () => listDrafts(username).then(setDrafts, () => setDrafts([]))
    load()
    draftEvents.addEventListener('change', load)
    return () => draftEvents.removeEventListener('change', load)
  }, [username])

  return drafts
}
