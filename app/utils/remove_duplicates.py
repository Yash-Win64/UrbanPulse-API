"""
Script: remove_duplicates.py
Purpose: Detect and remove duplicate hourly entries safely for MySQL
"""

from sqlalchemy import text
from app.db.database import engine

def remove_duplicates(table_name, unique_cols):
    with engine.begin() as conn:
        print(f"\n🧹 Checking for duplicates in {table_name}...")

        # Detect duplicates
        dup_query = text(f"""
            SELECT {', '.join(unique_cols)}, COUNT(*) AS duplicate_count
            FROM {table_name}
            GROUP BY {', '.join(unique_cols)}
            HAVING COUNT(*) > 1;
        """)
        duplicates = conn.execute(dup_query).fetchall()

        if not duplicates:
            print(f"✅ No duplicates found in {table_name}.")
            return

        print(f"⚠️ Duplicates found in {table_name}: {len(duplicates)} groups")

        # Safe delete using JOIN to avoid MySQL 1093 error
        delete_query = text(f"""
            DELETE t1 FROM {table_name} t1
            JOIN {table_name} t2
            ON { ' AND '.join([f't1.{col} = t2.{col}' for col in unique_cols]) }
            WHERE t1.id < t2.id;
        """)
        result = conn.execute(delete_query)
        print(f"🗑️ Removed {result.rowcount} duplicate rows from {table_name}")

def main():
    print("=== 🧠 UrbanPulse Hourly Duplicate Cleaner ===")

    remove_duplicates("traffic_hourly", ["location", "hour_start"])
    remove_duplicates("weather_hourly", ["city", "hour_start"])
    remove_duplicates("air_quality_hourly", ["city", "hour_start"])

    print("\n✅ Duplicate cleanup complete.\n")

if __name__ == "__main__":
    main()
