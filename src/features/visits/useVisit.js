import { useCallback, useEffect, useState } from 'react'
import { getVisit } from '../../services/api/visits.service'

// Loads one uploaded visit from the server.
export function useVisit(id) {
  const [visit, setVisit] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => getVisit(id).then(setVisit, (e) => setError(e.message)), [id])

  useEffect(() => {
    reload()
  }, [reload])

  return { visit, error, reload }
}
