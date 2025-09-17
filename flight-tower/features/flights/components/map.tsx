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
  center: [number, number]
  zoom?: number
  flights?: FlightSummary[]
  selectedFlightId?: string | null
  onFlightSelect?: (flight: FlightSummary | null) => void
  userLocation?: { lat: number; lng: number } | null
}

// Ustawienia mapy Google
const containerStyle = {
  width: "100%",
  height: "420px",
}

// // Opcjonalnie możesz dopasować zoom i inne opcje mapy
// const defaultZoom = 2
// const zoomWithCenter = 6

export default function FlightsMap({
  center = [0, 0],
  zoom = 6,
  flights = [],
  selectedFlightId,
  onFlightSelect,
  userLocation,
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

  // Create plane icon for markers with rotation and scale
  const getPlaneIcon = (rotation: number, scale: number = 1) => {
    const baseSize = 48;  // Base size of the icon
    const scaledSize = Math.round(baseSize * scale);
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 286.98 286.98" fill="#111111">
          <g transform="rotate(${rotation - 90} 143.49 143.49)">
            <path d="M32.64,126.533L8.604,98.724h21.993l37.305,24.867l-15.412,1.216c-4.704,0-9.152,0.453-13.252,1.258L32.64,126.533z"></path>
            <path d="M30.596,188.926H8.604l24.037-27.812l6.446,0.464c4.077,0.807,8.498,1.266,13.16,1.266c0.011,0,0.021,0,0.031,0l15.612,1.224L30.596,188.926z"></path>
            <polygon points="126.594,249.781 87.563,249.781 137.507,169.541 200.196,174.477 "></polygon>
            <path d="M210.251,117.793c4.504-0.633,9.298-1.01,14.396-1.129l0.391-0.034c0.11,0.016,0.242,0.029,0.338,0.016l1.972-0.047c32.315,0,59.632,12.469,59.632,27.229c0,14.744-27.306,27.221-59.632,27.221l-1.972-0.058c-0.011,0-0.026,0-0.043,0c-0.11,0-0.205,0.005-0.316,0.016l-0.537-0.037c-4.957-0.11-9.756-0.485-14.418-1.139l-1.255-0.11c-0.454-0.507-1.018-0.907-1.74-0.949l-70.585-5.084c-0.488-0.042-0.931,0.074-1.329,0.264l-57.009-4.482c-0.411-0.327-0.907-0.549-1.458-0.58l-36.914-2.668c-11.372-2.331-18.591-7.558-18.591-12.393c0-4.836,7.23-10.081,18.71-12.396l36.795-2.658c0.541-0.037,1.021-0.264,1.432-0.577l58.314-4.591c0.016,0,0.034,0,0.045,0l70.601-5.091c0.548-0.037,1.033-0.253,1.46-0.583L210.251,117.793z"></path>
            <path d="M2.7,37.515h68.296c1.49,0,2.7-1.21,2.7-2.7c0-1.49-1.21-2.7-2.7-2.7H2.7c-1.489,0-2.7,1.21-2.7,2.7 C0,36.305,1.21,37.515,2.7,37.515z"></path> 
            <path d="M2.7,63.613h68.296c1.49,0,2.7-1.21,2.7-2.7c0-1.489-1.21-2.7-2.7-2.7H2.7c-1.489,0-2.7,1.21-2.7,2.7 C0,62.403,1.21,63.613,2.7,63.613z"></path> <path d="M2.7,228.762h68.296c1.49,0,2.7-1.213,2.7-2.7s-1.21-2.7-2.7-2.7H2.7c-1.489,0-2.7,1.213-2.7,2.7 S1.21,228.762,2.7,228.762z"></path> <path d="M2.7,254.865h68.296c1.49,0,2.7-1.213,2.7-2.7s-1.21-2.7-2.7-2.7H2.7c-1.489,0-2.7,1.213-2.7,2.7 S1.21,254.865,2.7,254.865z"></path>
            <polygon points="126.594,37.515 200.517,113.146 137.724,118.088 87.563,37.515 "></polygon>
          </g>
        </svg>`
      )}`,
      scaledSize: new google.maps.Size(scaledSize, scaledSize),
      anchor: new google.maps.Point(scaledSize / 2, scaledSize / 2),  // Center point for rotation
    };
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
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
            title="Your location"
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
              icon={getPlaneIcon(rotation, 0.7)}  // You can adjust the scale (0.8) as needed
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
