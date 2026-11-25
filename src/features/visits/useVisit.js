import { useCallback, useEffect, useState } from 'react'
import { pendingEvents } from '../../services/api/pending.service'
import { getVisit } from '../../services/api/visits.service'

// Loads one uploaded visit from the server.
export function useVisit(id) {
  const [visit, setVisit] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => getVisit(id).then(setVisit, (e) => setError(e.message)), [id])

  useEffect(() => {
    reload()
  }, [reload])

  // Review / photo approval / ★ Best changed (admin): load the visit again.
  useEffect(() => {
    pendingEvents.addEventListener('change', reload)
    return () => pendingEvents.removeEventListener('change', reload)
  }, [reload])

  // The server counts AI photos in the background: check again until the numbers arrive.
  useEffect(() => {
    if (!visit?.aiCounting) return
    const t = setTimeout(reload, 15000)
    return () => clearTimeout(t)
  }, [visit, reload])

  return { visit, error, reload }
}
