"""
Background Scheduler for UrbanPulse
Runs the collector every X seconds (set in .env)
This file is executed only by the Render Worker Service.
"""

import time
import logging
from app.services.data_collector import collect_all_data
from app.config import settings

# Interval comes from your .env (COLLECTION_INTERVAL)
INTERVAL = float(settings.COLLECTION_INTERVAL)

# Logging setup
logger = logging.getLogger("Scheduler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

def run_scheduler():
    logger.info(f"🔥 UrbanPulse Scheduler started | Interval: {INTERVAL} seconds")

    while True:
        try:
            collect_all_data()
        except Exception as e:
            logger.exception(f"❌ Scheduler error: {e}")

        logger.info(f"⏳ Sleeping for {INTERVAL} seconds...\n")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    run_scheduler()
