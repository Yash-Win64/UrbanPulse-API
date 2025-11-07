import os
from dotenv import load_dotenv
import warnings

# avoid noisy dotenv warnings:
warnings.filterwarnings("ignore", category=UserWarning, module="dotenv")

# load .env from project root
load_dotenv()

class Settings:
    # Location
    LATITUDE = os.getenv("LATITUDE", "12.9716")
    LONGITUDE = os.getenv("LONGITUDE", "77.5946")
    CITY = os.getenv("CITY", "Bangalore")

    # API Keys
    TOMTOM_KEY = os.getenv("TOMTOM_KEY")
    OPENWEATHER_KEY = os.getenv("OPENWEATHER_KEY")
    OPEN_METEO_URL = os.getenv(
        "OPEN_METEO_URL",
        "https://air-quality-api.open-meteo.com/v1/air-quality"
    )

    # Database
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost/urbanpulse"
    )

    # Logging level
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Collector interval (in seconds)
    COLLECTION_INTERVAL = float(os.getenv("COLLECTION_INTERVAL", 410.0))


# single instance to import anywhere
settings = Settings()

# backward compatible constants for older modules
LATITUDE = settings.LATITUDE
LONGITUDE = settings.LONGITUDE
CITY = settings.CITY
TOMTOM_KEY = settings.TOMTOM_KEY
OPENWEATHER_KEY = settings.OPENWEATHER_KEY
OPEN_METEO_URL = settings.OPEN_METEO_URL
DATABASE_URL = settings.DATABASE_URL
COLLECTION_INTERVAL = settings.COLLECTION_INTERVAL

