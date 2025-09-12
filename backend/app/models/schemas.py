from pydantic import BaseModel, Field
from typing import Optional

class SearchRequest(BaseModel):
    lat: float
    lon: float
    radius_km: int = Field(..., ge=5, le=100)
    limit: int = Field(10, ge=1, le=50)

class FlightSummary(BaseModel):
    id: Optional[str]
    callsign: Optional[str] 
    lat: float
    lon: float
    distance_km: float
    altitude_ft: Optional[int]
    speed_kts: Optional[int]
    origin_airport_name: Optional[str]
    origin_airport_iata: Optional[str]
    destination_airport_name: Optional[str]
    destination_airport_iata: Optional[str]
    heading_deg: Optional[int]

# Stricter model for the 'route' part of FlightDetail
class RouteDetail(BaseModel):
    # Use an alias because 'from' is a reserved keyword in Python.
    # Pydantic will automatically use this alias for serialization.
    from_prop: Optional[str] = Field(None, alias='from')
    to_prop: Optional[str] = Field(None, alias='to')
    
    class Config:
        # Allows the model to be populated by field name OR alias
        populate_by_name = True

# Stricter model for the 'times' part of FlightDetail
class TimeDetail(BaseModel):
    scheduled_departure: Optional[int]
    scheduled_arrival: Optional[int]
    duration_readable: Optional[str]

class FlightDetail(BaseModel):
    airline: Optional[str]
    aircraft_code: Optional[str]
    route: RouteDetail
    times: TimeDetail
    origin_country: Optional[str]
    destination_country: Optional[str]