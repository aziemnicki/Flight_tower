export type FlightSummary = {
  id: string | null
  callsign: string | null
  lat: number
  lon: number
  distance_km: number
  altitude_ft: number | null
  speed_kts: number | null
  origin_airport_name: string | null
  origin_airport_iata: string | null
  destination_airport_name: string | null
  destination_airport_iata: string | null
  heading_deg: number | null
}

export type FlightDetail = {
  airline: string | null
  aircraft_code: string | null
  route: { from: string | null; to: string | null }
  times: {
    scheduled_departure: number | null
    scheduled_arrival: number | null
    duration_readable: string | null
  }
  origin_country: string | null
  destination_country: string | null
}

export type FlightsSearchResponse = {
  count: number
  flights: FlightSummary[]
}
