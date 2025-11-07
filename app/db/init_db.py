
from sqlalchemy import text
from app.db.database import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE air_quality_hourly ADD COLUMN avg_pm10 FLOAT"))
    conn.execute(text("ALTER TABLE air_quality_hourly ADD COLUMN avg_no2 FLOAT"))
    conn.execute(text("ALTER TABLE air_quality_hourly ADD COLUMN avg_o3 FLOAT"))
    conn.commit()

