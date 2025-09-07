"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useGeolocation() {
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message || "Unable to get location")
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // optional: watch position for realtime updates
  const startWatch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    if (watchId.current != null) return
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setPosition(p),
      (e) => setError(e.message || "Watch failed"),
      { enableHighAccuracy: true }
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopWatch()
  }, [stopWatch])

  return { loading, position, error, getCurrentPosition, startWatch, stopWatch }
}
