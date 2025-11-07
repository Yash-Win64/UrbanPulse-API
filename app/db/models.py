from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from .database import Base

class TrafficData(Base):
    __tablename__ = "traffic_data"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    current_speed = Column(Float)
    free_flow_speed = Column(Float)
    confidence = Column(Float)
    road_closure = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(100))  # length required
    temperature = Column(Float)
    humidity = Column(Float)
    condition = Column(String(50))  # length required
    timestamp = Column(DateTime, default=datetime.utcnow)

class AirQualityData(Base):
    __tablename__ = "air_quality_data"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(100))  # length required
    aqi = Column(Float)
    pm25 = Column(Float)
    pm10 = Column(Float)
    co = Column(Float)
    no2 = Column(Float)
    o3 = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


class TrafficHourly(Base):
    __tablename__ = "traffic_hourly"
    id = Column(Integer, primary_key=True)
    location = Column(String(100))  # ✅ specify length
    hour_start = Column(DateTime)
    avg_speed = Column(Float)
    free_flow_avg = Column(Float)
    samples = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeatherHourly(Base):
    __tablename__ = "weather_hourly"
    id = Column(Integer, primary_key=True)
    city = Column(String(100))  # ✅ specify length
    hour_start = Column(DateTime)
    avg_temp = Column(Float)
    avg_humidity = Column(Float)
    samples = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class AirQualityHourly(Base):
    __tablename__ = "air_quality_hourly"

    id = Column(Integer, primary_key=True)
    city = Column(String(100))
    hour_start = Column(DateTime)
    avg_aqi = Column(Float)
    avg_pm25 = Column(Float)
    avg_pm10 = Column(Float)
    avg_no2 = Column(Float)
    avg_o3 = Column(Float)
    samples = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

