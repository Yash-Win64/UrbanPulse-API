from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes import weather, air_quality, traffic, analytics
from app.db import models
from app.db.database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UrbanPulse Live Data API",
    description="Fetch live urban data for Smart City Analytics",
    version="1.0"
)

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    icon_path = os.path.join("app", "static", "favicon.ico")
    if os.path.exists(icon_path):
        return FileResponse(icon_path)
    return {"detail": "favicon not found"}

# Register all routers
app.include_router(weather.router, prefix="/api")
app.include_router(air_quality.router, prefix="/api")
app.include_router(traffic.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")  # ✅ This line is critical

@app.get("/")
def root():
    return {"message": "Welcome to UrbanPulse API - Live Data Service"}

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.services import data_collector, data_aggregator
import threading

@app.on_event("startup")
def start_background_services():
    # Collector thread (every ~7 min)
    collector_thread = threading.Thread(target=data_collector.start_background_collector, daemon=True)
    collector_thread.start()

    # Aggregator thread (every 2 hours)
    def run_aggregator():
        import time
        while True:
            data_aggregator.aggregate_hourly_data()
            time.sleep(2 * 60 * 60)  # every 2 hours
    agg_thread = threading.Thread(target=run_aggregator, daemon=True)
    agg_thread.start()

    print("✅ Background collector and aggregator launched.")

