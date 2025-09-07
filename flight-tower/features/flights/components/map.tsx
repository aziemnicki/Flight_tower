"use client"

import { useState, useEffect, useMemo } from "react"
import type { FlightSummary } from "@/features/flights/types"
import { FlightDetailDrawer } from "./flight-detail-drawer"
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api"

type Props = {
  centerLat?: number
  centerLon?: number
  hasCenter?: boolean
  flights?: FlightSummary[]
}

// Ustawienia mapy Google
const containerStyle = {
  width: "100%",
  height: "420px",
}

// Opcjonalnie możesz dopasować zoom i inne opcje mapy
const defaultZoom = 2
const zoomWithCenter = 6

export default function FlightsMap({
  centerLat = 0,
  centerLon = 0,
  hasCenter = false,
  flights = [],
}: Props) {
  // Klucz API Google Maps (musisz podać własny)
  // Najlepiej przechowywać go w ENV i wstawiać przez env variables
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Załaduj skrypt Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Pozycja i zoom mapy
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 })
  const [zoom, setZoom] = useState(defaultZoom)

  useEffect(() => {
    const lat = typeof centerLat === "number" && !isNaN(centerLat) ? centerLat : 0
    const lng = typeof centerLon === "number" && !isNaN(centerLon) ? centerLon : 0
    setCenter({ lat, lng })
    setZoom(hasCenter ? zoomWithCenter : defaultZoom)
  }, [centerLat, centerLon, hasCenter])

  // Filtrowanie lotów z prawidłowymi współrzędnymi
  const filteredFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return []
    return flights
      .filter(flight =>
        flight &&
        typeof flight.lat === "number" &&
        typeof flight.lon === "number" &&
        !isNaN(flight.lat) &&
        !isNaN(flight.lon)
      )
      .slice(0, 500)
  }, [flights])

  if (!isLoaded) return <div>Ładowanie mapy...</div>;

  // Teraz google jest dostępne, możesz stworzyć ikonę:
  const planeIcon = {
    path: "M0 -10 L6 0 L0 4 L-6 0 Z",
    fillColor: "#111",
    fillOpacity: 1,
    strokeColor: "#fff",
    strokeWeight: 1,
    scale: 1.5,
    anchor: new google.maps.Point(0, 0),
  };

  if (loadError) return <div>Błąd ładowania mapy</div>
  if (!isLoaded) return <div>Ładowanie mapy...</div>

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
        onZoomChanged={() => {
          // Możesz obsłużyć zoom, jeśli chcesz synchronizować stan zoomu
        }}
        onCenterChanged={() => {
          // Jeśli chcesz synchronizować center
          // const newCenter = mapRef.current.getCenter();
          // setCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
        }}
      >
        {/* Marker dla pozycji centralnej */}
        {hasCenter && (
          <Marker
            position={center}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
            title="You are here"
          />
        )}

        {/* Markery lotów */}
        {filteredFlights.map((flight) => {
          // Ustawienie ikony z obrotem wg heading_deg
          // Obrót ikony w Google Maps to heading w stopniach (rotacja)
          const rotation = flight.heading_deg || 0
          return (
            <Marker
              key={flight.id || `flight-${Math.random()}`}
              position={{ lat: flight.lat, lng: flight.lon }}
              icon={{
                path:
                  "M0 -10 L6 0 L0 4 L-6 0 Z",
                fillColor: "#111",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 1,
                scale: 1.5,
                anchor: new google.maps.Point(0, 0),
                rotation,
              }}
              onClick={() => flight.id && setSelectedId(flight.id)}
              title={flight.callsign || "N/A"}
            />
          )
        })}
      </GoogleMap>

      {/* Kontrolki zoomu */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md flex flex-col space-y-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 1, 20))}
          className="w-8 h-8 text-lg font-bold flex items-center justify-center hover:bg-gray-100 rounded"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 1, 2))}
          className="w-8 h-8 text-lg font-bold flex items-center justify-center hover:bg-gray-100 rounded"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Drawer ze szczegółami lotu */}
      <FlightDetailDrawer
        open={!!selectedId}
        flightId={selectedId ?? ""}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  )
}
