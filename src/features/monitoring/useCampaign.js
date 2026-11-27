import { useCallback } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { getTargets } from '../../services/api/targets.service'

// District targets with progress from the server → { progress: { overall, byCity, asOf } | null }.
// progress is null when no city has a target (Staff get 403; Admins and Clients can read targets).
export function useCampaign() {
  const load = useCallback(() => getTargets().catch((err) => (err.status === 403 ? null : Promise.reject(err))), [])
  const res = useAsync(load)
  usePendingChanges(res.reload)
  return { ...res, progress: res.data?.overall ? res.data : null }
}
