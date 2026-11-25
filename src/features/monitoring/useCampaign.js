import { useCallback, useMemo } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { getTarget } from '../../services/api/pending.service'
import { listVisits } from '../../services/api/visits.service'
import { campaignProgress } from './target'

// The campaign target and the visits inside its dates → progress (null when no target is set).
export function useCampaign() {
  const load = useCallback(async () => {
    const target = await getTarget()
    return { target, visits: target ? await listVisits({ dateFrom: target.start, dateTo: target.end }) : [] }
  }, [])
  const res = useAsync(load)
  usePendingChanges(res.reload)
  const progress = useMemo(() => (res.data?.target ? campaignProgress(res.data.target, res.data.visits) : null), [res.data])
  return { ...res, target: res.data?.target ?? null, progress }
}
