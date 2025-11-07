from fastapi import APIRouter, HTTPException
import requests
from app.config import OPENWEATHER_KEY
from app.utils.api_client import APIClient
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.database import get_db
from app.db import models


router = APIRouter()

@router.get("/weather/{city}")
def get_weather(city: str):
    """Fetch live weather data for a city"""
    if not OPENWEATHER_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API key not configured")
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": OPENWEATHER_KEY, "units": "metric"}
    r = requests.get(url, params=params, timeout=10)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    data = r.json()
    return {
        "city": city,
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "condition": data["weather"][0]["description"],
        "wind_speed": data.get("wind", {}).get("speed")
    }



@router.get("/hourly")
def get_hourly_weather(db: Session = Depends(get_db)):
    """Fetch the last 10 hourly aggregated weather records."""
    data = (
        db.query(models.WeatherHourly)
        .order_by(models.WeatherHourly.hour_start.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "city": row.city,
            "avg_temp": row.avg_temp,
            "avg_humidity": row.avg_humidity,
            "samples": row.samples,
            "hour_start": row.hour_start
        }
        for row in data
    ]
