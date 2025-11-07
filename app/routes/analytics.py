from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import TrafficHourly, WeatherHourly, AirQualityHourly

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/traffic/hourly")
def get_traffic_hourly(db: Session = Depends(get_db)):
    data = db.query(TrafficHourly).order_by(TrafficHourly.hour_start.desc()).limit(50).all()
    if not data:
        raise HTTPException(status_code=404, detail="No traffic hourly data found")
    return data

@router.get("/weather/hourly")
def get_weather_hourly(db: Session = Depends(get_db)):
    data = db.query(WeatherHourly).order_by(WeatherHourly.hour_start.desc()).limit(50).all()
    if not data:
        raise HTTPException(status_code=404, detail="No weather hourly data found")
    return data

@router.get("/air/hourly")
def get_air_hourly(db: Session = Depends(get_db)):
    data = db.query(AirQualityHourly).order_by(AirQualityHourly.hour_start.desc()).limit(50).all()
    if not data:
        raise HTTPException(status_code=404, detail="No air hourly data found")
    return data

