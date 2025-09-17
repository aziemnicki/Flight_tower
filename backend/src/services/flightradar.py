from FlightRadar24 import FlightRadar24API
from geopy.distance import geodesic
import sys
import traceback
from ..utils import cache

fr_api = FlightRadar24API()

def get_flights(lat: float, lon: float, radius_km: int, limit: int):
    print(f"[service.get_flights] Getting flights for lat={lat}, lon={lon}, radius_km={radius_km}", file=sys.stdout, flush=True)
    try:
        bounds = fr_api.get_bounds_by_point(lat, lon, radius_km * 1000)
        print(f"[service.get_flights] Calculated bounds: {bounds}", file=sys.stdout, flush=True)
        flights = fr_api.get_flights(bounds=bounds)
        print(f"[service.get_flights] Received {len(flights)} flights from FlightRadar24 API.", file=sys.stdout, flush=True)

        print(f"[service.get_flights] Caching {len(flights)} flight objects for 10 minutes...", file=sys.stdout, flush=True)
        for flight in flights:
            if flight.id:
                cache.set(flight.id, flight, ttl=600)

    except Exception as e:
        print(f"[service.get_flights] Error fetching flights from FlightRadar24 API: {e}", file=sys.stderr, flush=True)
        raise

    user_location = (lat, lon)
    flight_summaries = []
    print(f"[service.get_flights] Processing {len(flights)} flights...", file=sys.stdout, flush=True)
    for i, flight in enumerate(flights):
        try:
            if hasattr(flight, 'latitude') and hasattr(flight, 'longitude') and flight.latitude and flight.longitude:
                distance_km = geodesic(user_location, (flight.latitude, flight.longitude)).km
                summary = {
                    "id": flight.id,
                    "callsign": flight.callsign,
                    "lat": flight.latitude,
                    "lon": flight.longitude,
                    "distance_km": distance_km,
                    "altitude_ft": flight.altitude,
                    "speed_kts": flight.ground_speed,
                    "origin_airport_name": getattr(flight, 'origin_airport_name', None),
                    "origin_airport_iata": getattr(flight, 'origin_airport_iata', None),
                    "destination_airport_name": getattr(flight, 'destination_airport_name', None),
                    "destination_airport_iata": getattr(flight, 'destination_airport_iata', None),
                    "heading_deg": flight.heading,
                }
                flight_summaries.append(summary)
            else:
                print(f"[service.get_flights] Skipping flight {getattr(flight, 'id', 'N/A')} due to missing coordinates.", file=sys.stdout, flush=True)
        except Exception as e:
            print(f"[service.get_flights] Error processing flight {getattr(flight, 'id', 'N/A')} (item {i}): {e}", file=sys.stderr, flush=True)

    print(f"[service.get_flights] Successfully processed {len(flight_summaries)} flights.", file=sys.stdout, flush=True)
    flight_summaries.sort(key=lambda f: f['distance_km'])
    
    limited_flights = flight_summaries[:limit]
    print(f"[service.get_flights] Sorted and limited to {len(limited_flights)} flights. Returning.", file=sys.stdout, flush=True)
    return limited_flights

def _create_error_response(error_type: str, message: str, airline: str, aircraft_code: str) -> dict:
    """Helper function to create consistent error responses."""
    return {
        "error": error_type,
        "message": message,
        "airline": airline,
        "aircraft_code": aircraft_code,
        "route": {"from": "N/A", "to": "N/A"},
        "times": {"scheduled_departure": None, "scheduled_arrival": None, "duration_readable": "N/A"},
        "origin_country": "N/A",
        "destination_country": "N/A",
    }

def _fetch_flight_from_api(flight_id: str):
    """Attempt to fetch flight data directly from the API."""
    try:
        flights = fr_api.get_flights(bounds=fr_api.get_bounds_by_point(lat=0, lon=0, radius=20000))
        return next((f for f in flights if f.id == flight_id), None)
    except Exception as e:
        print(f"[service.get_flight_details] Error fetching flight from API: {str(e)}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        return None

def get_flight_details_from_obj(flight_id: str):
    print(f"[service.get_flight_details] Getting details for flight_id: {flight_id}", file=sys.stdout, flush=True)
    
    # Try to get flight from cache
    flight_obj = cache.get(flight_id)
    print(f"[service.get_flight_details] Cache get for {flight_id} returned: {flight_obj is not None}", file=sys.stdout, flush=True)
    
    # If not in cache, try to fetch from API
    if not flight_obj:
        print(f"[service.get_flight_details] Flight {flight_id} not in cache, fetching from API...", file=sys.stdout, flush=True)
        flight_obj = _fetch_flight_from_api(flight_id)
        
        if not flight_obj:
            print(f"[service.get_flight_details] Flight {flight_id} not found in API results", file=sys.stderr, flush=True)
            return _create_error_response(
                error_type="Flight not found",
                message="The requested flight could not be found. Please try again or check the flight ID.",
                airline="Flight not found",
                aircraft_code="N/A"
            )
            
        # Cache the flight object for future use
        print(f"[service.get_flight_details] Caching flight {flight_id} for 5 minutes", file=sys.stdout, flush=True)
        cache.set(flight_id, flight_obj, timeout=300)
    
    # Get flight details
    try:
        print("[service.get_flight_details] Fetching flight details...", file=sys.stdout, flush=True)
        flight_details = fr_api.get_flight_details(flight_obj)
        print("[service.get_flight_details] Successfully fetched flight details", file=sys.stdout, flush=True)
    except Exception as e:
        error_msg = f"Failed to fetch flight details: {str(e)}"
        print(f"[service.get_flight_details] {error_msg}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        return _create_error_response(
            error_type="API Error",
            message="Failed to fetch flight details. Please try again later.",
            airline="Data unavailable",
            aircraft_code="N/A"
        )

    if not isinstance(flight_details, dict):
        print(f"[service.get_flight_details] Details for {flight_id} is not a dict, returning default structure.", file=sys.stdout, flush=True)
        return {
            "airline": None,
            "aircraft_code": None,
            "route": {"from": None, "to": None},
            "times": {"scheduled_departure": None, "scheduled_arrival": None, "duration_readable": None},
            "origin_country": None,
            "destination_country": None,
        }

    print(f"[service.get_flight_details] Processing details for {flight_id}...", file=sys.stdout, flush=True)

    def get_nested(data, *keys, default=None):
        for key in keys:
            if not isinstance(data, dict) or data is None or key not in data or data[key] is None:
                return default
            data = data[key]
        return data

    airline_name = get_nested(flight_details, 'airline', 'name')
    aircraft_code = get_nested(flight_details, 'aircraft', 'code', 'text')

    origin_airport_name = get_nested(flight_details, 'airport', 'origin', 'name')
    origin_airport_iata = get_nested(flight_details, 'airport', 'origin', 'code', 'iata')
    dest_airport_name = get_nested(flight_details, 'airport', 'destination', 'name')
    dest_airport_iata = get_nested(flight_details, 'airport', 'destination', 'code', 'iata')
    
    route_from = f"{origin_airport_name} ({origin_airport_iata})" if origin_airport_name and origin_airport_iata else origin_airport_name or origin_airport_iata
    route_to = f"{dest_airport_name} ({dest_airport_iata})" if dest_airport_name and dest_airport_iata else dest_airport_name or dest_airport_iata

    scheduled_departure = get_nested(flight_details, 'time', 'scheduled', 'departure')
    scheduled_arrival = get_nested(flight_details, 'time', 'scheduled', 'arrival')

    duration_readable = "N/A"
    if scheduled_departure and scheduled_arrival:
        duration = scheduled_arrival - scheduled_departure
        hours = duration // 3600
        minutes = (duration % 3600) // 60
        duration_readable = f"{int(hours)}h {int(minutes)}m"

    origin_country = get_nested(flight_details, 'airport', 'origin', 'position', 'country', 'name')
    destination_country = get_nested(flight_details, 'airport', 'destination', 'position', 'country', 'name')

    result = {
        "airline": airline_name,
        "aircraft_code": aircraft_code,
        "route": {"from": route_from, "to": route_to},
        "times": {
            "scheduled_departure": scheduled_departure,
            "scheduled_arrival": scheduled_arrival,
            "duration_readable": duration_readable,
        },
        "origin_country": origin_country,
        "destination_country": destination_country,
    }
    print(f"[service.get_flight_details] Processed details for {flight_id}: {result}", file=sys.stdout, flush=True)
    return result

if __name__ == "__main__":
    # Przykład: pobierz 10 lotów w okolicy Londynu
    lat, lon = 51.5072, -0.1276
    radius_km = 50
    limit = 10

    print(f"--- get_flights(lat={lat}, lon={lon}, radius_km={radius_km}, limit={limit}) ---")
    flights_summary = get_flights(lat, lon, radius_km, limit)
    print(f"Found {len(flights_summary)} flights:")
    for f in flights_summary:
        print({k: v for k, v in f.items() if k != "obj"})  # pokazuje dane do podglądu; pomijamy obiekt lotu

    # Pobierz szczegóły dla pierwszego lotu (jeśli jakikolwiek jest)
    if flights_summary:
        flight_id = flights_summary[0]['id']
        print(f"\n--- get_flight_details_from_obj for id: '{flight_id}' ---")
        details = get_flight_details_from_obj(flight_id)
        print(details)
    else:
        print("\n--- No flights found ---")
