import os
import requests
from app.config import OPENWEATHER_KEY, WAQI_TOKEN, TOMTOM_KEY

def fetch_weather(city):
    print(f"[DEBUG] OPENWEATHER_KEY = {OPENWEATHER_KEY}")
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
    r = requests.get(url)
    print(f"[DEBUG] Weather URL: {url}")
    print(f"[DEBUG] Response: {r.text}")
    r.raise_for_status()
    return r.json()

def fetch_air_quality(city):
    print(f"[DEBUG] WAQI_TOKEN = {WAQI_TOKEN}")
    url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
    r = requests.get(url)
    print(f"[DEBUG] AQI URL: {url}")
    print(f"[DEBUG] Response: {r.text}")
    r.raise_for_status()
    return r.json()

def fetch_traffic(lat, lon):
    print(f"[DEBUG] TOMTOM_KEY = {TOMTOM_KEY}")
    url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point={lat},{lon}&key={TOMTOM_KEY}"
    r = requests.get(url)
    print(f"[DEBUG] Traffic URL: {url}")
    print(f"[DEBUG] Response: {r.text}")
    r.raise_for_status()
    return r.json()
