from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/")
def read_health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
