import { useCallback, useState } from 'react'

export function useGeolocation() {
  const [state, setState] = useState({ coords: null, error: null, loading: false })

  const locate = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const error = 'Location is not supported on this device.'
          setState((s) => ({ ...s, error }))
          return reject(new Error(error))
        }
        setState((s) => ({ ...s, loading: true, error: null }))
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const coords = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }
            setState({ coords, error: null, loading: false })
            resolve(coords)
          },
          (err) => {
            const error =
              err.code === err.PERMISSION_DENIED
                ? 'Location permission denied. Allow location in your browser to continue.'
                : 'Could not get your location. Move to an open area and try again.'
            setState((s) => ({ ...s, error, loading: false }))
            reject(new Error(error))
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
        )
      }),
    [],
  )

  return { ...state, locate }
}
