import os
import json
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import TrafficHourly, WeatherHourly, AirQualityHourly

OUTPUT_DIR = "app/static/dashboard"
os.makedirs(OUTPUT_DIR, exist_ok=True)
STATE_FILE = os.path.join(OUTPUT_DIR, "last_fetch_state.json")

def log(msg):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{now} | {msg}")

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"traffic": 0, "weather": 0, "air": 0}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def fetch_historical_data():
    session = SessionLocal()
    try:
        state = load_state()

        traffic = session.query(TrafficHourly).filter(TrafficHourly.id > state["traffic"]).all()
        weather = session.query(WeatherHourly).filter(WeatherHourly.id > state["weather"]).all()
        air = session.query(AirQualityHourly).filter(AirQualityHourly.id > state["air"]).all()

        df_t = pd.DataFrame([{
            "id": t.id, "location": t.location, "hour_start": t.hour_start,
            "avg_speed": t.avg_speed, "free_flow_avg": t.free_flow_avg, "samples": t.samples
        } for t in traffic])

        df_w = pd.DataFrame([{
            "id": w.id, "city": w.city, "hour_start": w.hour_start,
            "avg_temp": w.avg_temp, "avg_humidity": w.avg_humidity, "samples": w.samples
        } for w in weather])

        df_a = pd.DataFrame([{
            "id": a.id, "city": a.city, "hour_start": a.hour_start,
            "avg_pm25": a.avg_pm25, "avg_aqi": a.avg_aqi, "samples": a.samples
        } for a in air])

        for df in [df_t, df_w, df_a]:
            if not df.empty:
                df['hour_start'] = pd.to_datetime(df['hour_start'], errors='coerce')

        # Update last seen IDs
        if not df_t.empty: state["traffic"] = int(df_t["id"].max())
        if not df_w.empty: state["weather"] = int(df_w["id"].max())
        if not df_a.empty: state["air"] = int(df_a["id"].max())
        save_state(state)

        log("✅ Historical data fetched successfully!")
        return df_t, df_w, df_a
    except Exception as e:
        log(f"❌ Error fetching historical data: {e}")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
    finally:
        session.close()

def plot_trends(df_t, df_w, df_a):
    """Generates and saves trend charts."""
    if not df_t.empty:
        plt.figure()
        df_t.plot(x='hour_start', y='avg_speed', title='Average Traffic Speed Over Time', legend=False)
        plt.ylabel("Speed (km/h)")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "traffic_trend.png"))
        plt.close()

    if not df_w.empty:
        plt.figure()
        df_w.plot(x='hour_start', y='avg_temp', title='Temperature Over Time (°C)', legend=False)
        plt.ylabel("Temperature (°C)")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "weather_trend.png"))
        plt.close()

    if not df_a.empty:
        plt.figure()
        df_a.plot(x='hour_start', y='avg_aqi', title='Air Quality Index (AQI) Over Time', legend=False)
        plt.ylabel("AQI")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "air_trend.png"))
        plt.close()

    log("📊 Trend charts updated!")

def generate_html_dashboard():
    html = f"""
    <html>
    <head>
        <title>UrbanPulse Analytics Dashboard</title>
        <style>
            body {{
                background: #0f172a;
                color: #f1f5f9;
                font-family: 'Segoe UI', sans-serif;
                text-align: center;
            }}
            h1 {{ color: #38bdf8; }}
            img {{
                width: 70%;
                border-radius: 12px;
                margin: 20px 0;
                box-shadow: 0 0 20px rgba(0,0,0,0.3);
            }}
        </style>
    </head>
    <body>
        <h1>🌐 UrbanPulse Real-Time Analytics</h1>
        <h3>Last Updated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</h3>
        <img src="traffic_trend.png" alt="Traffic Trend">
        <img src="weather_trend.png" alt="Weather Trend">
        <img src="air_trend.png" alt="Air Quality Trend">
    </body>
    </html>
    """
    with open(os.path.join(OUTPUT_DIR, "dashboard.html"), "w", encoding="utf-8") as f:
        f.write(html)
    log("🌍 Dashboard HTML updated!")

def run_analytics_cycle():
    log("🔍 Running smart data analytics fetcher...")
    df_t, df_w, df_a = fetch_historical_data()
    if df_t.empty and df_w.empty and df_a.empty:
        log("⚠️ No new data to visualize.")
        return
    plot_trends(df_t, df_w, df_a)
    generate_html_dashboard()
    log("🎯 Dashboard generation complete!")

if __name__ == "__main__":
    run_analytics_cycle()

