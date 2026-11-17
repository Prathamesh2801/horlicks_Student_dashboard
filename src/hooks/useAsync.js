import { useCallback, useEffect, useRef, useState } from 'react'

// Runs `loader` (a useCallback'd async function) now and whenever it changes; reload() runs it again.
// data stays visible while a new load runs (refreshing), and a failed refresh keeps the old data + error.
export function useAsync(loader) {
  const [state, setState] = useState({ data: null, error: null, refreshing: true, loadedAt: null })
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    setState((s) => ({ ...s, refreshing: true }))
    try {
      const data = await loader()
      if (id === latest.current) setState({ data, error: null, refreshing: false, loadedAt: new Date().toISOString() })
    } catch (err) {
      if (id === latest.current) setState((s) => ({ ...s, error: err.message, refreshing: false }))
    }
  }, [loader])

  useEffect(() => {
    reload()
  }, [reload])

  return { ...state, loading: state.data == null && !state.error, reload }
}
