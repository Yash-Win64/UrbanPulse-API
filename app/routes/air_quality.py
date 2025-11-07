from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import requests
from app.config import OPEN_METEO_URL
from app.db.database import get_db
from app.db import models

router = APIRouter(prefix="/air_quality", tags=["Air Quality"])


# ---------- Utility: Calculate AQI from PM2.5 ----------
def calculate_aqi(pm25: float | None) -> float | None:
    """Calculate AQI from PM2.5 based on CPCB (India) standard."""
    if pm25 is None:
        return None

    try:
        # CPCB breakpoints for PM2.5 (µg/m³)
        breakpoints = [
            (0, 30, 0, 50),
            (31, 60, 51, 100),
            (61, 90, 101, 200),
            (91, 120, 201, 300),
            (121, 250, 301, 400),
            (251, 500, 401, 500),
        ]

        for bp_low, bp_high, aqi_low, aqi_high in breakpoints:
            if bp_low <= pm25 <= bp_high:
                aqi = ((aqi_high - aqi_low) / (bp_high - bp_low)) * (pm25 - bp_low) + aqi_low
                return round(aqi, 1)

        return 500.0  # Beyond measurable range

    except Exception as e:
        print(f"⚠️ AQI calculation failed: {e}")
        return None


# ---------- Main Endpoint: Live Air Quality ----------
@router.get("/")
def get_air_quality():
    """Fetch live air quality data using Open-Meteo API."""
    try:
        response = requests.get(OPEN_METEO_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not isinstance(data, dict) or "hourly" not in data:
            raise HTTPException(status_code=502, detail="Invalid response from Open-Meteo API")

        hourly = data.get("hourly", {})
        pm25 = (hourly.get("pm2_5") or [None])[-1]
        pm10 = (hourly.get("pm10") or [None])[-1]
        co = (hourly.get("carbon_monoxide") or [None])[-1]
        no2 = (hourly.get("nitrogen_dioxide") or [None])[-1]
        o3 = (hourly.get("ozone") or [None])[-1]

        aqi_value = calculate_aqi(pm25)

        # --- AQI Category ---
        if aqi_value is None:
            category = "No Data"
        elif aqi_value <= 50:
            category = "Good"
        elif aqi_value <= 100:
            category = "Satisfactory"
        elif aqi_value <= 200:
            category = "Moderate"
        elif aqi_value <= 300:
            category = "Poor"
        elif aqi_value <= 400:
            category = "Very Poor"
        else:
            category = "Severe"

        # --- Safe structured return ---
        return {
            "source": "Open-Meteo Air Quality API",
            "city": "Bangalore",
            "coordinates": {
                "latitude": data.get("latitude", 0.0),
                "longitude": data.get("longitude", 0.0),
            },
            "air_quality": {
                "pm10": pm10 if pm10 is not None else 0.0,
                "pm2_5": pm25 if pm25 is not None else 0.0,
                "co": co if co is not None else 0.0,
                "no2": no2 if no2 is not None else 0.0,
                "o3": o3 if o3 is not None else 0.0,
                "aqi": aqi_value if aqi_value is not None else 0.0,
            },
            "category": category,
            "timezone": data.get("timezone", "Asia/Kolkata"),
        }

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Air Quality API timeout")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ---------- Historical / Hourly Aggregated Data ----------
@router.get("/hourly")
def get_hourly_air_quality(db: Session = Depends(get_db)):
    """Fetch the last 10 hourly aggregated air quality records."""
    try:
        records = (
            db.query(models.AirQualityHourly)
            .order_by(models.AirQualityHourly.hour_start.desc())
            .limit(10)
            .all()
        )

        if not records:
            return []

        result = []
        for row in records:
            result.append({
                "city": row.city or "Unknown",
                "avg_pm25": float(row.avg_pm25) if row.avg_pm25 is not None else 0.0,
                "avg_aqi": float(row.avg_aqi) if row.avg_aqi is not None else 0.0,
                "samples": int(row.samples) if row.samples is not None else 0,
                "hour_start": row.hour_start,
            })
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
