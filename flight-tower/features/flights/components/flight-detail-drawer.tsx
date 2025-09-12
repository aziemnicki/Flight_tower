"use client"

import { useEffect, useState } from "react"
import { getFlightDetail } from "@/features/flights/lib/api"
import type { FlightDetail } from "@/features/flights/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import countries from 'world-countries'
import { useI18n } from "@/features/flights/lib/i18n-provider"

export function FlightDetailDrawer({
  open = false,
  onOpenChange = () => {},
  flightId = "",
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  flightId?: string
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FlightDetail | null>(null)

  // Function to get country code from country name
  const getCountryCode = (countryName: string): string | undefined => {
    if (!countryName) return undefined;
    const country = countries.find(c => 
      c.name.common.toLowerCase() === countryName.toLowerCase() ||
      c.name.official.toLowerCase() === countryName.toLowerCase()
    );
    return country?.cca2.toLowerCase();
  }

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('flight_details.title')}</DialogTitle>
          <DialogDescription>
            {t('flight_details.description')}
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
            <div><strong>{t('flight_details.airline')}</strong> {data.airline ?? t('flights_list.unknown')}</div>
            <div><strong>{t('flight_details.aircraft')}</strong> {data.aircraft_code ?? t('flights_list.unknown')}</div>
            <div><strong>{t('flight_details.route')}</strong> {data.route.from ?? t('flights_list.unknown')} → {data.route.to ?? t('flights_list.unknown')}</div>
            <div><strong>{t('flight_details.times')}</strong> {data.times.duration_readable ?? t('flights_list.unknown')}</div>
            <div className="flex items-center gap-2">
              <strong>{t('flight_details.countries')}</strong>
              <div className="flex items-center gap-2">
                {data.origin_country && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg flex items-center">
                      {getCountryCode(data.origin_country) ? (
                        <img 
                          src={`https://flagcdn.com/24x18/${getCountryCode(data.origin_country)}.png`}
                          alt={data.origin_country}
                          className="mr-1 h-4 w-6 object-cover rounded-sm shadow-sm"
                          title={data.origin_country}
                          loading="lazy"
                        />
                      ) : null}
                      {data.origin_country}
                    </span>
                  </div>
                )}
                <span>→</span>
                {data.destination_country && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg flex items-center">
                      {getCountryCode(data.destination_country) ? (
                        <img 
                          src={`https://flagcdn.com/24x18/${getCountryCode(data.destination_country)}.png`}
                          alt={data.destination_country}
                          className="mr-1 h-4 w-6 object-cover rounded-sm shadow-sm"
                          title={data.destination_country}
                          loading="lazy"
                        />
                      ) : null}
                      {data.destination_country}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!loading && !data && <div className="text-sm text-muted-foreground">{'No details available.'}</div>}
      </DialogContent>
    </Dialog>
  )
}
