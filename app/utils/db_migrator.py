from app.db.database import engine
from sqlalchemy import text

def migrate_created_at():
    with engine.connect() as conn:
        print("🚀 Adding created_at columns to all hourly tables...")

        tables = ["traffic_hourly", "weather_hourly", "air_quality_hourly"]

        for table in tables:
            # Check if 'created_at' column already exists
            check_query = text(f"SHOW COLUMNS FROM {table} LIKE 'created_at';")
            result = conn.execute(check_query).fetchall()

            if not result:
                print(f"🧩 Adding created_at to {table} ...")
                alter_query = text(f"""
                    ALTER TABLE {table}
                    ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                """)
                conn.execute(alter_query)
                print(f"✅ created_at added to {table}")
            else:
                print(f"✅ {table} already has created_at column")

        conn.commit()
        print("\n🎯 Migration complete!")

if __name__ == "__main__":
    migrate_created_at()

