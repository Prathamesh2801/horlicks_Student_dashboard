import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTableState } from '../../components/table'
import { periodRange } from '../../constants/visit'
import { useAsync } from '../../hooks/useAsync'
import { usePendingChanges } from '../../hooks/usePendingChanges'
import { getCities, listVisits } from '../../services/api/visits.service'

export const CLIENT_FILTERS = { city: '', period: 'all', from: '', to: '', type: '' }

// Approved visits for the client view, with date range + city filters in the URL.
// ponytail: filters approved visits in the browser; the server's client endpoint should return only those.
export function useClientVisits() {
  const [params] = useSearchParams()
  const get = (k) => params.get(k) ?? CLIENT_FILTERS[k]
  const [city, period, from, to] = ['city', 'period', 'from', 'to'].map(get)
  const load = useCallback(
    async () => (await listVisits({ city, ...periodRange(period, from, to) })).filter((v) => v.review === 'approved'),
    [city, period, from, to],
  )
  const res = useAsync(load)
  usePendingChanges(res.reload)
  const table = useTableState({ rows: res.data, filters: CLIENT_FILTERS, searchText: () => '' })
  const [cities, setCities] = useState([])
  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])
  return { ...res, table, cities, city }
}
