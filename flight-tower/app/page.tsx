"use client"

import { useEffect, useMemo, useState } from "react"
import { Radar, LocateFixed, Globe, RefreshCw, SunMoon, Plane, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

import { useI18n } from "@/features/flights/lib/i18n-provider"
import { I18nProvider } from "@/features/flights/lib/i18n-provider"
import { useGeolocation } from "@/features/flights/hooks/use-geolocation"
import { useFlights } from "@/features/flights/hooks/use-flights"
import type { FlightSummary } from "@/features/flights/types"
import { FlightsList } from "@/features/flights/components/flights-list"
import { FlightDetailDrawer } from "@/features/flights/components/flight-detail-drawer"

// Dynamically import the Map to avoid SSR issues
const FlightsMap = dynamic(() => import("@/features/flights/components/map"), { ssr: false, loading: () => (
<div className="flex h-64 w-full items-center justify-center text-muted-foreground">
  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading map...
</div>
)})

export default function Page() {
return (
  <I18nProvider defaultLocale="en">
    <HomeClient />
  </I18nProvider>
)
}

function HomeClient() {
const { t, locale, setLocale } = useI18n()
const { toast } = useToast()
const geoloc = useGeolocation()

const [lat, setLat] = useState<number | null>(null)
const [lon, setLon] = useState<number | null>(null)
const [radius, setRadius] = useState<number>(25)
const [limit, setLimit] = useState<number>(10)
const [autoRefresh, setAutoRefresh] = useState<boolean>(true)

const coordsReady = lat != null && lon != null

const { data, isLoading, error, refresh } = useFlights({
  lat: lat ?? 0,
  lon: lon ?? 0,
  radius_km: radius,
  limit,
  enabled: coordsReady,
  refreshIntervalMs: autoRefresh ? 15000 : 0,
})

useEffect(() => {
  if (geoloc.position) {
    setLat(geoloc.position.coords.latitude)
    setLon(geoloc.position.coords.longitude)
  }
}, [geoloc.position])

useEffect(() => {
  if (error) {
    toast({
      title: t("errors.fetch_failed"),
      description: t("messages.try_again_later"),
      variant: "destructive",
    })
  }
}, [error, t, toast])

const flights: FlightSummary[] = useMemo(() => data?.flights ?? [], [data])

return (
  <main className="min-h-screen bg-white dark:bg-neutral-950">
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5" />
          <span className="font-semibold">Flight Tower</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <select
              aria-label={t("aria.language")}
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "pl")}
            >
              <option value="en">EN</option>
              <option value="pl">PL</option>
            </select>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <Card className="h-max">
        <CardHeader>
          <CardTitle className="text-base">{t("controls.title")}</CardTitle>
          <CardDescription>{t("controls.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 px-4">
            <Button
              variant="secondary"
              onClick={() => geoloc.getCurrentPosition()}
              disabled={geoloc.loading}
              className="group justify-start relative transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg rounded-4xl"
            >
              <LocateFixed className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative">
                {geoloc.loading ? t("controls.getting_location") : t("controls.get_my_location")}
              </span>
            </Button>
            
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">{t("labels.latitude")}</Label>
              <Input
                id="lat"
                inputMode="decimal"
                placeholder={t("placeholders.latitude")}
                value={lat ?? ""}
                onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lon">{t("labels.longitude")}</Label>
              <Input
                id="lon"
                inputMode="decimal"
                placeholder={t("placeholders.longitude")}
                value={lon ?? ""}
                onChange={(e) => setLon(e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("labels.radius_km", { radius_km: radius })}</Label>
              <span className="text-sm text-muted-foreground">{radius} km</span>
            </div>
            <Slider
              value={[radius]}
              min={5}
              max={100}
              step={1}
              onValueChange={(v) => setRadius(v[0] ?? 25)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">{t("labels.limit")}</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value || 10))))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh" />
              <Label className="py-0 px-0.5" htmlFor="auto-refresh">{t("controls.auto_refresh")}</Label>
            </div>
            <Button
              onClick={() => {
                if (!coordsReady) {
                  toast({ title: t("errors.coords_missing"), variant: "destructive" })
                  return
                }
                refresh()
              }}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              {t("controls.find_flights")}
            </Button>
          </div>

          <Separator />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>{t("labels.status")}:</strong>{" "}
              {isLoading
                ? t("states.loading")
                : error
                  ? t("states.error")
                  : coordsReady && data
                    ? t("states.results", { count: data.count })
                    : t("states.idle")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <FlightsList flights={flights} />

        <Card className="overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4" /> {t("map.title")}
            </CardTitle>
            <CardDescription>{t("map.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <FlightsMap
              centerLat={lat ?? 0}
              centerLon={lon ?? 0}
              hasCenter={coordsReady}
              flights={flights}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  </main>
)
}

function ThemeToggle() {
// Minimal theme toggler: toggles class 'dark' on documentElement
const [isDark, setIsDark] = useState<boolean>(false)
useEffect(() => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark)
  }
}, [isDark])
return (
  <Button variant="ghost" size="icon" onClick={() => setIsDark((v) => !v)} aria-label="Toggle theme">
    <SunMoon className="h-5 w-5" />
  </Button>
)
}
