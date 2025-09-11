"use client"

import type { FlightSummary } from "@/features/flights/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plane, Info } from 'lucide-react'
import { useState } from "react"
import { FlightDetailDrawer } from "./flight-detail-drawer"
import { useI18n } from "@/features/flights/lib/i18n-provider"

export function FlightsList({ flights = [] as FlightSummary[] }) {
  const { t } = useI18n()

  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plane className="h-6 w-6" /> {t('flights_list.title')}
          <Badge variant="secondary" className="ml-5">{flights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        <ScrollArea className="h-64">
          <ul className="divide-y">
            {flights.map((f, i) => (
              <li key={`${f.id ?? "noid"}-${i}`} className="p-3 ml-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.callsign ?? t('flights_list.unknown')}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.origin_airport_iata ?? t('flights_list.unknown_airport')} → {f.destination_airport_iata ?? t('flights_list.unknown_airport')} • {f.distance_km.toFixed(1)} {t('units.km')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((f.altitude_ft ?? 0) * 0.3048)} {t('units.m')} • {Math.round((f.speed_kts ?? 0) * 1.852)} {t('units.kmh')} • {t('units.heading')} {(f.heading_deg ?? 0).toFixed(0)}°
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
                    onClick={() => f.id && setOpenId(f.id)}
                    disabled={!f.id}
                    aria-label="Open flight details"
                  >
                    <Info className="h-4 w-4" /> {t('flights_list.details')}
                  </button>
                </div>
              </li>
            ))}
            {flights.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">{t('flights_list.no_flights')}</li>
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
