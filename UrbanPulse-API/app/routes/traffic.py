from fastapi import APIRouter
import requests
from app.config import TOMTOM_KEY

router = APIRouter()

@router.get("/traffic/{lat}/{lon}")
def get_traffic(lat: float, lon: float):
    """Fetch live traffic flow data for a given location"""
    url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point={lat},{lon}&key={TOMTOM_KEY}"
    r = requests.get(url).json()

    flow = r.get("flowSegmentData", {})
    return {
        "current_speed": flow.get("currentSpeed"),
        "free_flow_speed": flow.get("freeFlowSpeed"),
        "confidence": flow.get("confidence"),
        "road_closure": flow.get("roadClosure")
    }
