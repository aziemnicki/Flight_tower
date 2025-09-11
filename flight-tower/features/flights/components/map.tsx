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
  center?: [number, number]
  zoom?: number
  flights?: FlightSummary[]
  selectedFlightId?: string | null
  onFlightSelect?: (flight: FlightSummary | null) => void
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
  center = [0, 0],
  zoom = 6,
  flights = [],
  selectedFlightId,
  onFlightSelect,
}: Props) {
  // Klucz API Google Maps (musisz podać własny)
  // Najlepiej przechowywać go w ENV i wstawiać przez env variables
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Załaduj skrypt Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const [selectedId, setSelectedId] = useState<string | null>(selectedFlightId || null)

  // Map center and zoom state
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ 
    lat: center[0] || 0, 
    lng: center[1] || 0
  })
  const [mapZoom, setMapZoom] = useState(zoom)

  // Update map center when center prop changes
  useEffect(() => {
    if (center[0] && center[1]) {
      setMapCenter({
        lat: center[0],
        lng: center[1]
      })
      setMapZoom(zoom)
    }
  }, [center, zoom])

  // Filtrowanie lotów z prawidłowymi współrzędnymi
  const filteredFlights = useMemo(() => {
    return flights.filter(
      (f) =>
        f.lat &&
        f.lon &&
        typeof f.lat === "number" &&
        typeof f.lon === "number" &&
        !isNaN(f.lat) &&
        !isNaN(f.lon)
    )
  }, [flights])

  // Handle flight selection
  const handleMarkerClick = (flight: FlightSummary) => {
    if (onFlightSelect) {
      onFlightSelect(flight)
    }
    setSelectedId(flight.id)
  }

  const handleMapClick = () => {
    setSelectedId(null)
    if (onFlightSelect) {
      onFlightSelect(null)
    }
  }

  if (!isLoaded) return <div>Loading map...</div>;

  // Create plane icon for markers
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
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
        onClick={handleMapClick}
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
        {center[0] && center[1] && (
          <Marker
            position={{ lat: center[0], lng: center[1] }}
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
              onClick={() => handleMarkerClick(flight)}
              title={flight.callsign || "N/A"}
            />
          )
        })}
      </GoogleMap>

      {/* Kontrolki zoomu */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md flex flex-col space-y-1">
        <button
          onClick={() => setMapZoom((z) => Math.min(z + 1, 20))}
          className="w-8 h-8 text-lg font-bold flex items-center justify-center hover:bg-gray-100 rounded"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setMapZoom((z) => Math.max(z - 1, 2))}
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
