"""
app/utils/data_validator.py
------------------------------------
Validates data quality for UrbanPulse hourly tables:
- traffic_hourly
- weather_hourly
- air_quality_hourly
"""

import pandas as pd
from sqlalchemy import create_engine, text

# -----------------------------
# 🧩 Database connection
# -----------------------------
DB_URL = "mysql+pymysql://root:bqxx4837%40ykm@localhost/urbanpulse"
engine = create_engine(DB_URL)

# -----------------------------
# 🧮 Helper Functions
# -----------------------------
def check_table(table_name):
    print(f"\n🔍 Checking table: {table_name}")

    query = f"SELECT * FROM {table_name};"
    df = pd.read_sql(query, engine)

    # 1️⃣ Basic info
    print(f"📊 Total Rows: {len(df)}")
    print(f"📋 Columns: {list(df.columns)}")

    # 2️⃣ Missing values
    missing = df.isna().sum()
    if missing.sum() == 0:
        print("✅ No missing values detected.")
    else:
        print("⚠️ Missing values:")
        print(missing[missing > 0])

    # 3️⃣ Duplicate rows
    dup_count = df.duplicated().sum()
    print(f"📎 Duplicates: {dup_count}")

    # 4️⃣ Outlier detection (for numeric columns)
    numeric_cols = df.select_dtypes(include="number").columns
    if not numeric_cols.empty:
        outlier_report = {}
        for col in numeric_cols:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outliers = df[(df[col] < lower) | (df[col] > upper)]
            if len(outliers) > 0:
                outlier_report[col] = len(outliers)
        if outlier_report:
            print("⚠️ Possible outliers detected:")
            for col, count in outlier_report.items():
                print(f"   - {col}: {count} values outside IQR range")
        else:
            print("✅ No significant outliers detected.")

    # 5️⃣ Time range check
    if "hour_start" in df.columns:
        print(f"🕒 Time Range: {df['hour_start'].min()} → {df['hour_start'].max()}")

    print("-" * 50)

# -----------------------------
# 🚀 Main
# -----------------------------
def main():
    print("=== 🧠 UrbanPulse Data Validator ===")
    tables = ["traffic_hourly", "weather_hourly", "air_quality_hourly"]
    for table in tables:
        check_table(table)

    print("\n✅ Data validation complete.\n")

if __name__ == "__main__":
    main()
