import { useCallback, useEffect, useState } from 'react'
import { getVisit } from '../../services/api/visits.service'

// Loads a visit and polls every 2 s while the AI is still counting.
export function useVisit(id) {
  const [visit, setVisit] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(
    () =>
      getVisit(id).then(setVisit, (e) => setError(e.message)),
    [id],
  )

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (visit?.status !== 'processing') return
    const timer = setInterval(reload, 2000)
    return () => clearInterval(timer)
  }, [visit?.status, reload])

  return { visit, error, reload }
}
