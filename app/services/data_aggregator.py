import warnings
warnings.filterwarnings("ignore")

import pandas as pd
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
from app.config import settings

# === DATABASE CONNECTION ===
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# === LOGGING ===
def log(msg, level="INFO"):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{now} | {level} | {msg}", flush=True)

# === GENERIC UPSERT ===
def upsert_hourly(conn, table, conflict_cols, data_dict):
    cols = ", ".join(data_dict.keys())
    vals = ", ".join([f":{k}" for k in data_dict.keys()])
    update_cols = [k for k in data_dict.keys() if k not in conflict_cols]
    update_clause = (
        ", ".join([f"{k}=VALUES({k})" for k in update_cols]) if update_cols else "id=id"
    )
    sql = f"""
        INSERT INTO {table} ({cols})
        VALUES ({vals})
        ON DUPLICATE KEY UPDATE {update_clause}
    """
    conn.execute(text(sql), data_dict)

# === TIME WINDOW ===
def get_time_window(minutes=20):
    """
    Returns (start, end) for the last aggregation window in UTC.
    Widened slightly (20 min) to catch any collector delay (collector runs ~6.8 min).
    """
    end = datetime.now(timezone.utc)
    start = end - timedelta(minutes=minutes)
    return start, end

# === TRAFFIC AGGREGATION ===
def aggregate_traffic(conn):
    start, end = get_time_window()
    query = """
        SELECT latitude, longitude,
               AVG(current_speed) AS avg_speed,
               AVG(free_flow_speed) AS free_flow_avg,
               COUNT(*) AS samples
        FROM traffic_data
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY latitude, longitude
    """
    try:
        df = pd.read_sql_query(text(query), conn, params={"start": start, "end": end})
    except Exception as e:
        log(f"Traffic SELECT failed: {e}", level="ERROR")
        return

    log(f"🚦 Traffic rows fetched (last 20 min): {len(df)}")

    if df.empty:
        log("No recent traffic data; skipping.", level="WARN")
        return

    for _, row in df.iterrows():
        location = f"{float(row['latitude']):.4f},{float(row['longitude']):.4f}"
        hour_start = start.replace(minute=0, second=0, microsecond=0)
        data = {
            "location": location,
            "hour_start": hour_start,
            "avg_speed": float(row["avg_speed"]) if row["avg_speed"] is not None else None,
            "free_flow_avg": float(row["free_flow_avg"]) if row["free_flow_avg"] is not None else None,
            "samples": int(row["samples"]),
            "created_at": datetime.now(timezone.utc),
        }
        upsert_hourly(conn, "traffic_hourly", ["location", "hour_start"], data)

    log("✅ Traffic hourly data aggregated successfully.")

# === WEATHER AGGREGATION ===
def aggregate_weather(conn):
    start, end = get_time_window()
    query = """
        SELECT city,
               AVG(temperature) AS avg_temp,
               AVG(humidity) AS avg_humidity,
               COUNT(*) AS samples
        FROM weather_data
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY city
    """
    try:
        df = pd.read_sql_query(text(query), conn, params={"start": start, "end": end})
    except Exception as e:
        log(f"Weather SELECT failed: {e}", level="ERROR")
        return

    log(f"🌦 Weather rows fetched (last 20 min): {len(df)}")

    if df.empty:
        log("No recent weather data; skipping.", level="WARN")
        return

    for _, row in df.iterrows():
        hour_start = start.replace(minute=0, second=0, microsecond=0)
        data = {
            "city": row["city"],
            "hour_start": hour_start,
            "avg_temp": float(row["avg_temp"]) if row["avg_temp"] is not None else None,
            "avg_humidity": float(row["avg_humidity"]) if row["avg_humidity"] is not None else None,
            "samples": int(row["samples"]),
            "created_at": datetime.now(timezone.utc),
        }
        upsert_hourly(conn, "weather_hourly", ["city", "hour_start"], data)

    log("✅ Weather hourly data aggregated successfully.")

# === AIR QUALITY AGGREGATION ===
def aggregate_air_quality(conn):
    start, end = get_time_window()
    query = """
        SELECT city,
               AVG(pm25) AS avg_pm25,
               AVG(pm10) AS avg_pm10,
               AVG(no2) AS avg_no2,
               AVG(o3) AS avg_o3,
               AVG(aqi) AS avg_aqi,
               COUNT(*) AS samples
        FROM air_quality_data
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY city
    """
    try:
        df = pd.read_sql_query(text(query), conn, params={"start": start, "end": end})
    except Exception as e:
        log(f"Air Quality SELECT failed: {e}", level="ERROR")
        return

    log(f"🌫 Air Quality rows fetched (last 20 min): {len(df)}")

    if df.empty:
        log("No recent air quality data; skipping.", level="WARN")
        return

    for _, row in df.iterrows():
        hour_start = start.replace(minute=0, second=0, microsecond=0)
        data = {
            "city": row["city"],
            "hour_start": hour_start,
            "avg_pm25": float(row["avg_pm25"]) if row["avg_pm25"] is not None else None,
            "avg_pm10": float(row["avg_pm10"]) if row["avg_pm10"] is not None else None,
            "avg_no2": float(row["avg_no2"]) if row["avg_no2"] is not None else None,
            "avg_o3": float(row["avg_o3"]) if row["avg_o3"] is not None else None,
            "avg_aqi": float(row["avg_aqi"]) if row["avg_aqi"] is not None else None,
            "samples": int(row["samples"]),
            "created_at": datetime.now(timezone.utc),
        }
        upsert_hourly(conn, "air_quality_hourly", ["city", "hour_start"], data)

    log("✅ Air Quality hourly data aggregated successfully.")

# === MASTER AGGREGATOR ===
def aggregate_hourly_data():
    log("🕒 Starting data aggregation cycle...")
    try:
        with engine.begin() as conn:
            aggregate_traffic(conn)
            aggregate_weather(conn)
            aggregate_air_quality(conn)
        log("🏁 Aggregation cycle completed successfully.")
    except Exception as e:
        log(f"Aggregation failed: {e}", level="ERROR")

# === SCHEDULER LOOP ===
if __name__ == "__main__":
    import time
    INTERVAL_MINUTES = 15
    while True:
        aggregate_hourly_data()
        print(f"⏳ Sleeping for {INTERVAL_MINUTES * 60} seconds...\n")
        time.sleep(INTERVAL_MINUTES * 60)


