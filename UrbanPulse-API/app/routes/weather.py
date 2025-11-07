from fastapi import APIRouter
import requests
from app.config import OPENWEATHER_KEY

router = APIRouter()

@router.get("/weather/{city}")
def get_weather(city: str):
    """Fetch live weather data for a city"""
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
    r = requests.get(url).json()

    if r.get("cod") != 200:
        return {"error": "Invalid city or request"}
    
    return {
        "city": city,
        "temperature": r["main"]["temp"],
        "humidity": r["main"]["humidity"],
        "condition": r["weather"][0]["description"],
        "wind_speed": r["wind"]["speed"]
    }
