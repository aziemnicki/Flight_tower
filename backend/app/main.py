import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, flights, geo

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


app = FastAPI()

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# # General exception handler to ensure CORS headers are always added
# @app.exception_handler(Exception)
# async def general_exception_handler(request: Request, exc: Exception):
#     # It's good practice to log the exception for debugging
#     print(f"Unhandled exception: {exc}")
#     response = JSONResponse(
#         status_code=500,
#         content={"message": f"Internal Server Error: {exc}"},
#     )
#     # Manually add CORS headers to the error response
#     response.headers["Access-Control-Allow-Origin"] = "*"
#     response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, DELETE, PUT"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
#     return response


# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(geo.router, prefix="/geo", tags=["geo"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

