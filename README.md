# UrbanPulse-API (Fixed)
FastAPI project that provides live urban data endpoints for Weather, Air Quality, and Traffic.

## Quick start
1. Copy `.env.example` to `.env` and fill your API keys.
2. Install requirements: `pip install -r requirements.txt`
3. Run locally: `uvicorn app.main:app --reload`
4. Endpoints:
   - GET /api/weather/{city}
   - GET /api/air_quality/{city}
   - GET /api/traffic/{lat}/{lon}
