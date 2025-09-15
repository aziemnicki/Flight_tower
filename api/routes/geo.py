from fastapi import APIRouter, Request
import geocoder

router = APIRouter()

@router.get("/ip")
def get_ip_location(request: Request):
    g = geocoder.ip("me")
    if g.ok and g.latlng:
        return {"lat": g.lat, "lon": g.lng, "source": "ip"}
    return {"lat": 0, "lon": 0, "source": "ip"}
