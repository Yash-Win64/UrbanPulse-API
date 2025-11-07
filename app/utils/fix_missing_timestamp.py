from app.db.database import engine
from sqlalchemy import text

def fix_missing_created_at():
    print("🧭 Fixing missing created_at timestamps in hourly tables...\n")

    tables = ["traffic_hourly", "weather_hourly", "air_quality_hourly"]

    with engine.connect() as conn:
        for table in tables:
            # Count rows where created_at is NULL
            count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table} WHERE created_at IS NULL;"))
            count = count_result.scalar()

            if count > 0:
                print(f"⚙️ {table}: Found {count} rows without created_at. Fixing...")
                conn.execute(text(f"""
                    UPDATE {table}
                    SET created_at = NOW()
                    WHERE created_at IS NULL;
                """))
                conn.commit()
                print(f"✅ {table}: All missing timestamps filled.\n")
            else:
                print(f"✅ {table}: No missing timestamps.\n")

    print("🎯 All tables fixed successfully!")

if __name__ == "__main__":
    fix_missing_created_at()
