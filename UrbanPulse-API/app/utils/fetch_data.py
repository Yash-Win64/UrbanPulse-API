# utils/fetch_data.py

import requests
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ===============================
# 🔹 Function: Fetch Live Traffic Data
# ===============================

def fetch_traffic_data(api_key: str, lat: float, lon: float, zoom: int = 10) -> Dict[str, Any]:
    """
    Fetch live traffic flow data from the TomTom Traffic API.

    Args:
        api_key (str): Your TomTom API key.
        lat (float): Latitude of the location.
        lon (float): Longitude of the location.
        zoom (int, optional): Zoom level (default = 10).

    Returns:
        dict: JSON response containing traffic flow data.
    """
    base_url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
    
    params = {
        "key": api_key,
        "point": f"{lat},{lon}"
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        logging.info(f"✅ Successfully fetched traffic data for ({lat}, {lon})")
        return data

    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Error fetching traffic data: {e}")
        return {"error": str(e)}

