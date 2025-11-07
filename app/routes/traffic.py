from fastapi import APIRouter, HTTPException
import requests
import os
from dotenv import load_dotenv
from app.utils.api_client import APIClient
from app.config import TOMTOM_KEY
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.database import get_db
from app.db import models

# Load .env variables
load_dotenv()
TOMTOM_KEY = os.getenv("TOMTOM_KEY")

router = APIRouter()

if not TOMTOM_KEY:
    raise RuntimeError("TomTom API key not configured. Please add TOMTOM_API_KEY to your .env")

@router.get("/traffic/{lat}/{lon}")
def get_traffic(lat: float, lon: float):
    """Fetch live traffic flow data for a given location dynamically."""
    
    url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
    params = {
        "point": f"{lat},{lon}",
        "unit": "KMPH",
        "key": TOMTOM_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()  # Raises HTTPError for 4xx/5xx
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=f"TomTom API error: {response.text}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")


    data = response.json()
    flow = data.get("flowSegmentData", {})
    coords = flow.get("coordinates", {}).get("coordinate", [])
    
    
    return {
        "latitude": lat,
        "longitude": lon,
        "current_speed": flow.get("currentSpeed"),
        "free_flow_speed": flow.get("freeFlowSpeed"),
        "confidence": flow.get("confidence"),
        "road_closure": flow.get("roadClosure"),
        "coordinates": coords[:10] 
    }

@router.get("/hourly")
def get_hourly_traffic(db: Session = Depends(get_db)):
    """Fetch the last 10 hourly aggregated traffic records."""
    data = (
        db.query(models.TrafficHourly)
        .order_by(models.TrafficHourly.hour_start.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "location": row.location,
            "avg_speed": row.avg_speed,
            "free_flow_avg": row.free_flow_avg,
            "samples": row.samples,
            "hour_start": row.hour_start
        }
        for row in data
    ]