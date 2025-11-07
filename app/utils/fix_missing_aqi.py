from app.db.database import engine
from sqlalchemy import text

def fix_missing_pm25():
    print("🧭 Fixing missing avg_pm25 values in air_quality_hourly...\n")

    with engine.connect() as conn:
        # Count missing values
        count_result = conn.execute(text("""
            SELECT COUNT(*) FROM air_quality_hourly WHERE avg_pm25 IS NULL;
        """))
        missing = count_result.scalar()

        if missing == 0:
            print("✅ No missing PM2.5 values found.")
            return

        print(f"⚙️ Found {missing} rows with missing avg_pm25. Calculating replacement value...")

        # Compute mean of non-null pm25 values
        mean_result = conn.execute(text("""
            SELECT AVG(avg_pm25) FROM air_quality_hourly WHERE avg_pm25 IS NOT NULL;
        """))
        mean_value = mean_result.scalar()

        if mean_value is None:
            print("⚠️ No valid PM2.5 data available to impute from.")
            return

        print(f"📈 Using mean PM2.5 value = {mean_value:.2f} for missing entries...")

        # Update missing values
        conn.execute(text(f"""
            UPDATE air_quality_hourly
            SET avg_pm25 = {mean_value}
            WHERE avg_pm25 IS NULL;
        """))
        conn.commit()

        print(f"✅ Filled {missing} missing avg_pm25 rows with mean value {mean_value:.2f}")

if __name__ == "__main__":
    fix_missing_pm25()
