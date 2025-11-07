import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import TrafficHourly, WeatherHourly, AirQualityHourly

def fetch_data():
    """Fetch historical aggregated data"""
    session = SessionLocal()
    traffic = pd.read_sql(session.query(TrafficHourly).statement, session.bind)
    weather = pd.read_sql(session.query(WeatherHourly).statement, session.bind)
    air = pd.read_sql(session.query(AirQualityHourly).statement, session.bind)
    session.close()
    return traffic, weather, air

def visualize():
    traffic_df, weather_df, air_df = fetch_data()

    # Check if data exists
    if traffic_df.empty and weather_df.empty and air_df.empty:
        print("⚠️ No data found for visualization.")
        return

    # 🛣️ Traffic Trends
    if not traffic_df.empty:
        plt.figure(figsize=(8, 5))
        plt.plot(traffic_df['hour_start'], traffic_df['avg_speed'], marker='o', label='Avg Speed (km/h)')
        plt.plot(traffic_df['hour_start'], traffic_df['free_flow_avg'], marker='x', label='Free Flow Speed (km/h)')
        plt.title('Traffic Speed Trends (Hourly)')
        plt.xlabel('Hour')
        plt.ylabel('Speed (km/h)')
        plt.legend()
        plt.grid(True)
        plt.show()

    # 🌦️ Weather Trends
    if not weather_df.empty:
        plt.figure(figsize=(8, 5))
        plt.plot(weather_df['hour_start'], weather_df['avg_temp'], color='orange', marker='o', label='Temperature (°C)')
        plt.plot(weather_df['hour_start'], weather_df['avg_humidity'], color='blue', marker='x', label='Humidity (%)')
        plt.title('Weather Trends (Hourly)')
        plt.xlabel('Hour')
        plt.ylabel('Values')
        plt.legend()
        plt.grid(True)
        plt.show()

    # 💨 Air Quality Trends
    if not air_df.empty:
        plt.figure(figsize=(8, 5))
        plt.plot(air_df['hour_start'], air_df['avg_aqi'], color='green', marker='o', label='AQI')
        plt.title('Air Quality Index Trends (Hourly)')
        plt.xlabel('Hour')
        plt.ylabel('AQI')
        plt.legend()
        plt.grid(True)
        plt.show()

if __name__ == "__main__":
    visualize()
