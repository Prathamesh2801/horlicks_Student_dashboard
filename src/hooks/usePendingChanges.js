import { useEffect } from 'react'
import { pendingEvents } from '../services/api/pending.service'

// Re-run `reload` when review / photo flags / target / reports change (this tab or another).
export function usePendingChanges(reload) {
  useEffect(() => {
    pendingEvents.addEventListener('change', reload)
    return () => pendingEvents.removeEventListener('change', reload)
  }, [reload])
}
