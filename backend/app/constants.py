"""
Shared constants for demo/seed data.
Used by init_db, daily_sensor_generation, and insurance router.
"""
from datetime import datetime, timezone

# Demo businesses seeded at first run (one-time compliance data, excluded from daily generation)
DEMO_BUSINESSES = [
    {"name": "Amarillo Prime Cuts", "store_type": "butcher_shop", "city": "Amarillo", "industry": "Food & Beverage", "size": "small"},
    {"name": "Columbus Fine Wines", "store_type": "winery", "city": "Columbus", "industry": "Agriculture & Wine", "size": "large"},
    {"name": "Tacoma Meats & Deli", "store_type": "butcher_shop", "city": "Tacoma", "industry": "Food & Beverage", "size": "medium"},
    {"name": "Fairfield Estate Winery", "store_type": "winery", "city": "Fairfield", "industry": "Agriculture & Wine", "size": "medium"},
    {"name": "Georgetown Butcher Co.", "store_type": "butcher_shop", "city": "Georgetown", "industry": "Food & Beverage", "size": "small"},
    {"name": "Portland Valley Wines", "store_type": "winery", "city": "Portland", "industry": "Agriculture & Wine", "size": "large"},
]
DEMO_BUSINESS_NAMES = frozenset(b["name"] for b in DEMO_BUSINESSES)

# Fixed date for seeding demo business sensor readings so data is deterministic and stable
DEMO_SEED_DATE = datetime(2025, 2, 1, 12, 0, 0, tzinfo=timezone.utc)

# Hours to look back for sensor data when computing compliance for demo businesses (1 year)
DEMO_SENSOR_HOURS = 8760
