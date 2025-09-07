"use client"

import type { FlightSummary } from "@/features/flights/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plane, Info } from 'lucide-react'
import { useState } from "react"
import { FlightDetailDrawer } from "./flight-detail-drawer"

export function FlightsList({ flights = [] as FlightSummary[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plane className="h-4 w-4" /> Flights Nearby
          <Badge variant="secondary" className="ml-2">{flights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <ul className="divide-y">
            {flights.map((f, i) => (
              <li key={`${f.id ?? "noid"}-${i}`} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.callsign ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.origin_airport_iata ?? "?"} → {f.destination_airport_iata ?? "?"} • {f.distance_km.toFixed(1)} km
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(f.altitude_ft ?? 0).toFixed(0)} ft • {(f.speed_kts ?? 0).toFixed(0)} kts • hdg {(f.heading_deg ?? 0).toFixed(0)}°
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                    onClick={() => f.id && setOpenId(f.id)}
                    disabled={!f.id}
                    aria-label="Open flight details"
                  >
                    <Info className="h-3.5 w-3.5" /> Details
                  </button>
                </div>
              </li>
            ))}
            {flights.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">No flights found in the selected area.</li>
            )}
          </ul>
        </ScrollArea>
      </CardContent>

      <FlightDetailDrawer
        open={!!openId}
        flightId={openId ?? ""}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </Card>
  )
}
