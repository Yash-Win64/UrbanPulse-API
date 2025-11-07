from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Example: replace with your actual database URL
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/urbanpulse")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

db_url = os.getenv("DATABASE_URL")

# Add SSL configuration for Aiven MySQL
engine = create_engine(
    db_url,
    connect_args={
        "ssl": {
            "ssl_ca": "/etc/ssl/certs/ca-certificates.crt"
        }
    }
)


# ✅ Add this function at the end
def get_db():
    """FastAPI dependency to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
