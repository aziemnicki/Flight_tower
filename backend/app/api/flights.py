from fastapi import APIRouter, Response, HTTPException
from app.models.schemas import SearchRequest, FlightDetail
from app.services import flightradar
import sys
import traceback

router = APIRouter()

@router.options("/search")
def search_flights_options():
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )

@router.post("/search")
def search_flights(request: SearchRequest, response: Response):
    print(f"[/flights/search] Received request with body: {request.model_dump_json()}", flush=True)
    response.headers["Access-Control-Allow-Origin"] = "*"
    try:
        print(f"[/flights/search] Calling flightradar.get_flights with lat={request.lat}, lon={request.lon}, radius_km={request.radius_km}, limit={request.limit}", flush=True)
        flights = flightradar.get_flights(request.lat, request.lon, request.radius_km, request.limit)
        print(f"[/flights/search] flightradar.get_flights returned {len(flights)} flights.", flush=True)

        response_data = {
            "count": len(flights),
            "flights": flights
        }
        print(f"[/flights/search] Sending response: {{'count': {response_data['count']}, 'flights': [...]}}", flush=True)
        return response_data
    except Exception as e:
        print(f"[/flights/search] An exception occurred: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")


@router.get("/{flight_id}", response_model=FlightDetail)
def get_flight_details(flight_id: str):
    print(f"[/flights/{{flight_id}}] Received request for flight_id: {flight_id}", flush=True)
    try:
        print(f"[/flights/{{flight_id}}] Calling flightradar.get_flight_details_from_obj for flight_id: {flight_id}", flush=True)
        flight_details = flightradar.get_flight_details_from_obj(flight_id)
        print(f"[/flights/{{flight_id}}] flightradar.get_flight_details_from_obj returned: {flight_details is not None}", flush=True)

        if flight_details is None:
            print(f"[/flights/{{flight_id}}] Flight not found: {flight_id}", flush=True)
            raise HTTPException(status_code=404, detail="Flight not found")
        
        print(f"[/flights/{{flight_id}}] Sending response for flight_id: {flight_id}", flush=True)
        return flight_details
    except Exception as e:
        print(f"[/flights/{{flight_id}}] An exception occurred: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")