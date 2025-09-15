# frontend-app/api/index.py
import os 
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importy po przeniesieniu kodu pod api/backend/...
from backend.routes import health, flights, geo

app = FastAPI()

# CORS – opcjonalnie zawęź do konkretnego originu, gdy będzie znany host produkcyjny
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dla jednego hosta można to docelowo ograniczyć
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rejestracja routerów
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(geo.router, prefix="/geo", tags=["geo"])

# Na Vercel nie uruchamiamy uvicorn w __main__; runtime sam podnosi ASGI app
# if __name__ == "__main__": ...
