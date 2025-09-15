import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the 'api' directory to the Python path to find the 'backend' module
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api'))

from routes import health, flights, geo

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(geo.router, prefix="/geo", tags=["geo"])
