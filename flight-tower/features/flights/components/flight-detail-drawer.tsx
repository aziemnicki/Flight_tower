"use client"

import { useEffect, useState } from "react"
import { getFlightDetail } from "@/features/flights/lib/api"
import type { FlightDetail } from "@/features/flights/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export function FlightDetailDrawer({
  open = false,
  onOpenChange = () => {},
  flightId = "",
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  flightId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FlightDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!open || !flightId) return
      console.log(`[FlightDetailDrawer] Fetching details for flightId: ${flightId}`)
      setLoading(true)
      setData(null) // Reset previous data
      try {
        const d = await getFlightDetail(flightId)
        console.log(`[FlightDetailDrawer] Fetched data for ${flightId}:`, d)
        if (!cancelled) {
          setData(d)
        }
      } catch (error) {
        console.error(`[FlightDetailDrawer] Error fetching details for ${flightId}:`, error)
        if (!cancelled) {
          setData(null) // Ensure data is cleared on error
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      console.log(`[FlightDetailDrawer] Cancelling fetch for flightId: ${flightId}`)
      cancelled = true
    }
  }, [open, flightId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flight Details</DialogTitle>
          <DialogDescription>
            Detailed information for the selected flight, fetched from live data.
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        )}
        {!loading && data && (
          <div className="space-y-3 text-sm">
            <div><strong>Airline:</strong> {data.airline ?? "N/A"}</div>
            <div><strong>Aircraft:</strong> {data.aircraft_code ?? "N/A"}</div>
            <div><strong>Route:</strong> {data.route.from ?? "?"} → {data.route.to ?? "?"}</div>
            <div><strong>Times:</strong> {data.times.duration_readable ?? "N/A"}</div>
            <div><strong>Countries:</strong> {data.origin_country ?? "?"} → {data.destination_country ?? "?"}</div>
          </div>
        )}
        {!loading && !data && <div className="text-sm text-muted-foreground">{'No details available.'}</div>}
      </DialogContent>
    </Dialog>
  )
}
