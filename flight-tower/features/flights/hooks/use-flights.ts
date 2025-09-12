"use client"

import useSWR from "swr"
import type { FlightsSearchResponse } from "@/features/flights/types"
import { searchFlights } from "@/features/flights/lib/api"

export function useFlights(opts: {
  lat: number
  lon: number
  radius_km: number
  limit: number
  enabled?: boolean
  refreshIntervalMs?: number
}) {
  const { lat, lon, radius_km, limit, enabled = true, refreshIntervalMs = 0 } = opts

  const key = enabled ? ["flights", lat, lon, radius_km, limit] : null

  const { data, error, isValidating, mutate } = useSWR<FlightsSearchResponse>(
    key,
    async (swrKey) => {
      console.log(`[useFlights] SWR key triggered fetch:`, swrKey)
      const [_, lat, lon, radius_km, limit] = swrKey as [string, number, number, number, number]
      console.log("[useFlights] Calling searchFlights with:", { lat, lon, radius_km, limit })
      try {
        const result = await searchFlights({ lat, lon, radius_km, limit })
        console.log("[useFlights] searchFlights successful, returning data for SWR:", result)
        return result
      } catch (e) {
        console.error("[useFlights] searchFlights threw an error:", e)
        throw e // re-throw for SWR to handle it as an error
      }
    },
    {
      revalidateOnFocus: false,
      refreshInterval: refreshIntervalMs,
      keepPreviousData: true,
      onError: (err, key) => {
        console.error(`[useFlights] SWR onError callback for key ${JSON.stringify(key)}:`, err)
      },
    }
  )

  return {
    data,
    error,
    isLoading: !data && !error && enabled,
    isValidating,
    refresh: () => mutate(),
  }
}