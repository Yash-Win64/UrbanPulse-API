from app.db import database, models

session = database.SessionLocal()
latest = session.query(models.AirQualityData).order_by(models.AirQualityData.timestamp.desc()).first()
print(latest.__dict__)
session.close()