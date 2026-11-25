import { useCallback, useEffect, useState } from 'react'
import { pendingEvents, withPending } from '../../services/api/pending.service'
import { getVisit } from '../../services/api/visits.service'

// Loads one uploaded visit from the server.
export function useVisit(id) {
  const [visit, setVisit] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => getVisit(id).then(setVisit, (e) => setError(e.message)), [id])

  useEffect(() => {
    reload()
  }, [reload])

  // Review / photo flags changed (admin): update in place.
  useEffect(() => {
    const merge = () => setVisit((v) => v && withPending(v))
    pendingEvents.addEventListener('change', merge)
    return () => pendingEvents.removeEventListener('change', merge)
  }, [])

  return { visit, error, reload }
}
