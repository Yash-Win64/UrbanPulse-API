import os
import time
import threading
import logging
from datetime import datetime, timezone
import requests
from sqlalchemy.orm import Session
from app.db import database, models
from app.config import settings

# === CONFIG ===
LATITUDE = float(settings.LATITUDE)
LONGITUDE = float(settings.LONGITUDE)
CITY = settings.CITY
OPEN_METEO_URL = settings.OPEN_METEO_URL
OPENWEATHER_KEY = settings.OPENWEATHER_KEY
TOMTOM_KEY = settings.TOMTOM_KEY
COLLECTION_INTERVAL = float(settings.COLLECTION_INTERVAL)

# === LOGGING ===
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
log_file = os.path.join(LOG_DIR, "collector.log")

file_handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
console_handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger = logging.getLogger("Collector")
logger.setLevel(logging.INFO)
logger.handlers = []
logger.addHandler(file_handler)
logger.addHandler(console_handler)
log = logger


# ---------- AQI Calculation (CPCB Standard) ----------
def calculate_aqi(pm25):
    """Calculate AQI from PM2.5 using CPCB breakpoints."""
    if pm25 is None:
        return None

    try:
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
                return round(
                    ((aqi_high - aqi_low) / (bp_high - bp_low)) * (pm25 - bp_low) + aqi_low,
                    1,
                )
        return 500.0
    except Exception as e:
        log.error(f"AQI calculation error: {e}")
        return None


# ---------- Core Collection Function ----------
def collect_all_data():
    """Collect traffic, weather, and air quality data and store them in DB."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z")
    log.info(f"Collecting all data at {now_str}")

    db: Session = database.SessionLocal()

    try:
        # --- TRAFFIC ---
        try:
            traffic_url = (
                "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
                f"?point={LATITUDE},{LONGITUDE}&unit=KMPH&key={TOMTOM_KEY}"
            )
            resp = requests.get(traffic_url, timeout=10)
            resp.raise_for_status()

            data = resp.json().get("flowSegmentData", {})

            entry = models.TrafficData(
                latitude=LATITUDE,
                longitude=LONGITUDE,
                current_speed=data.get("currentSpeed"),
                free_flow_speed=data.get("freeFlowSpeed"),
                confidence=data.get("confidence"),
                road_closure=str(data.get("roadClosure")),
                timestamp=datetime.now(timezone.utc),
            )

            db.add(entry)
            db.commit()
            log.info(f"Traffic stored ({LATITUDE}, {LONGITUDE})")
        except Exception as e:
            log.error(f"Traffic collection failed: {e}")

        # --- WEATHER ---
        try:
            weather_url = (
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?q={CITY}&units=metric&appid={OPENWEATHER_KEY}"
            )
            resp = requests.get(weather_url, timeout=10)
            resp.raise_for_status()

            data = resp.json()
            main = data.get("main", {})
            condition = data.get("weather", [{}])[0].get("main")

            entry = models.WeatherData(
                city=CITY,
                temperature=main.get("temp"),
                humidity=main.get("humidity"),
                condition=condition,
                timestamp=datetime.now(timezone.utc),
            )

            db.add(entry)
            db.commit()
            log.info(f"Weather stored | {CITY}: {main.get('temp')}°C, {main.get('humidity')}%")
        except Exception as e:
            log.error(f"Weather collection failed: {e}")

        # --- AIR QUALITY ---
        try:
            resp = requests.get(OPEN_METEO_URL, timeout=10)
            resp.raise_for_status()

            data = resp.json()
            hourly = data.get("hourly", {})

            if not hourly:
                log.warning("No hourly air quality data available.")
            else:
                pm25 = (hourly.get("pm2_5") or [None])[-1]
                pm10 = (hourly.get("pm10") or [None])[-1]
                co = (hourly.get("carbon_monoxide") or [None])[-1]
                no2 = (hourly.get("nitrogen_dioxide") or [None])[-1]
                o3 = (hourly.get("ozone") or [None])[-1]

                aqi_value = calculate_aqi(pm25)

                entry = models.AirQualityData(
                    city=CITY,
                    pm25=pm25,
                    pm10=pm10,
                    co=co,
                    no2=no2,
                    o3=o3,
                    aqi=aqi_value,
                    timestamp=datetime.now(timezone.utc),
                )

                db.add(entry)
                db.commit()

                log.info(f"Air Quality stored | {CITY}: PM2.5={pm25}, AQI={aqi_value}")
        except Exception as e:
            log.error(f"Air Quality collection failed: {e}")

    finally:
        db.close()
        log.info("Data collection cycle complete.")


# ---------- Scheduler ----------
def run_scheduler():
    log.info(f"Auto collector started (interval: {COLLECTION_INTERVAL} seconds)")
    while True:
        try:
            collect_all_data()
        except Exception:
            log.exception("Unhandled collector error:")
        log.info(f"Sleeping for {COLLECTION_INTERVAL} seconds...")
        time.sleep(COLLECTION_INTERVAL)


def start_background_collector():
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    log.info("Background collector thread launched.")


if __name__ == "__main__":
    start_background_collector()
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        log.info("Collector stopped manually.")


