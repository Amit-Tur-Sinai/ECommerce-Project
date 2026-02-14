"""
Daily Sensor Data Generation

Generates synthetic sensor readings once per day for each business in the database.
Runs as a scheduled job (e.g., 6 AM daily, before recommendations are generated).

For each business, generates realistic sensor readings based on:
- Business type (butcher shop sensors differ from winery sensors)
- Current weather conditions for the business's city
- The business's compliance history

After generating readings, recalculates compliance scores and updates business_rankings.

# TODO: Replace with real IoT sensor data ingestion
# In production, this script would be replaced by a real-time API/webhook endpoint
# that receives actual sensor data from IoT devices installed at each business.
# The current synthetic data generation serves as a placeholder for demo purposes.
# When real sensors are available:
#   1. Create a POST /sensors/ingest endpoint that accepts real sensor payloads
#   2. Authenticate each device with a unique API key
#   3. Store readings in the same sensor_readings table
#   4. Keep the compliance score calculation logic unchanged
#   5. Remove or archive this synthetic generation script
"""

import sys
import os
import hashlib
from datetime import datetime, timezone
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.db_models import (
    Business, SensorReading, RecommendationTracking,
    BusinessRanking, RecommendationStatus
)


# Sensor definitions per business type
SENSOR_CONFIGS = {
    "butcher_shop": [
        {"sensor_type": "Temperature", "unit": "°C", "location": "Refrigeration Unit 1", "normal_range": (0, 5), "warning_range": (5, 8), "critical_threshold": 8},
        {"sensor_type": "Temperature", "unit": "°C", "location": "Freezer Unit", "normal_range": (-20, -15), "warning_range": (-15, -10), "critical_threshold": -10},
        {"sensor_type": "Humidity", "unit": "%", "location": "Storage Area", "normal_range": (40, 70), "warning_range": (70, 85), "critical_threshold": 85},
        {"sensor_type": "Power", "unit": "%", "location": "Backup Generator", "normal_range": (80, 100), "warning_range": (60, 80), "critical_threshold": 60},
        {"sensor_type": "Temperature", "unit": "°C", "location": "Display Counter", "normal_range": (2, 6), "warning_range": (6, 10), "critical_threshold": 10},
    ],
    "winery": [
        {"sensor_type": "Temperature", "unit": "°C", "location": "Fermentation Tank 1", "normal_range": (12, 18), "warning_range": (18, 22), "critical_threshold": 22},
        {"sensor_type": "Humidity", "unit": "%", "location": "Barrel Room", "normal_range": (55, 75), "warning_range": (75, 85), "critical_threshold": 85},
        {"sensor_type": "Temperature", "unit": "°C", "location": "Wine Cellar", "normal_range": (10, 15), "warning_range": (15, 20), "critical_threshold": 20},
        {"sensor_type": "Power", "unit": "%", "location": "Cooling System", "normal_range": (85, 100), "warning_range": (65, 85), "critical_threshold": 65},
        {"sensor_type": "Humidity", "unit": "%", "location": "Vineyard Station", "normal_range": (40, 65), "warning_range": (65, 80), "critical_threshold": 80},
    ],
}


def deterministic_value(seed: str, min_val: float, max_val: float) -> float:
    """Generate a deterministic float value from a seed string.
    
    Given the same seed, always returns the same value.
    This ensures sensor readings are reproducible.
    """
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    # Normalize to [0, 1]
    normalized = (h % 10000) / 10000.0
    return round(min_val + normalized * (max_val - min_val), 1)


def generate_sensor_readings_for_business(
    business: Business,
    date: datetime,
) -> List[Dict]:
    """
    Generate deterministic sensor readings for a business on a given date.
    
    The readings are seeded by business_id + date, so the same business
    on the same day always produces the same readings.
    
    # TODO: Replace with real IoT sensor data ingestion
    # This function generates synthetic data for demo purposes.
    # In production, real sensor data would come from IoT devices.
    """
    store_type = business.store_type or "butcher_shop"
    configs = SENSOR_CONFIGS.get(store_type, SENSOR_CONFIGS["butcher_shop"])
    
    date_str = date.strftime("%Y-%m-%d")
    readings = []
    
    for i, config in enumerate(configs):
        # Deterministic seed based on business + date + sensor index
        seed = f"{business.business_id}-{date_str}-{i}"
        
        # Determine status deterministically
        status_seed = int(hashlib.sha256(f"{seed}-status".encode()).hexdigest(), 16) % 100
        
        if status_seed < 75:
            # Normal reading
            status = "normal"
            value = deterministic_value(
                f"{seed}-value",
                config["normal_range"][0],
                config["normal_range"][1]
            )
            compliance = "compliant"
        elif status_seed < 92:
            # Warning reading
            status = "warning"
            value = deterministic_value(
                f"{seed}-value",
                config["warning_range"][0],
                config["warning_range"][1]
            )
            compliance = "non_compliant"
        else:
            # Critical reading
            status = "critical"
            value = deterministic_value(
                f"{seed}-value",
                config["critical_threshold"],
                config["critical_threshold"] + 5
            )
            compliance = "non_compliant"
        
        sensor_id = f"{config['sensor_type'][:4].upper()}-{str(i + 1).zfill(3)}"
        
        readings.append({
            "business_id": business.business_id,
            "sensor_id": sensor_id,
            "sensor_type": config["sensor_type"],
            "location": config["location"],
            "reading_value": value,
            "unit": config["unit"],
            "status": status,
            "recommendation_compliance": compliance,
            "timestamp": date.replace(hour=6, minute=0, second=0, microsecond=0),
        })
    
    return readings


def run_daily_sensor_generation(db: Session, target_date: datetime = None):
    """
    Main entry point: generate sensor readings for all businesses.
    
    # TODO: Replace with real IoT sensor data ingestion
    # In production, this would be replaced by real-time data from IoT devices.
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc)
    
    businesses = db.query(Business).all()
    total_readings = 0
    
    print(f"[{target_date.strftime('%Y-%m-%d %H:%M')}] Generating sensor data for {len(businesses)} businesses...")
    
    for business in businesses:
        readings = generate_sensor_readings_for_business(business, target_date)
        
        for reading_data in readings:
            sensor_reading = SensorReading(
                business_id=reading_data["business_id"],
                sensor_id=reading_data["sensor_id"],
                sensor_type=reading_data["sensor_type"],
                location=reading_data["location"],
                reading_value=reading_data["reading_value"],
                unit=reading_data["unit"],
                status=reading_data["status"],
                recommendation_compliance=reading_data["recommendation_compliance"],
                timestamp=reading_data["timestamp"],
            )
            db.add(sensor_reading)
            total_readings += 1
        
        # Update business ranking
        _update_business_ranking(db, business)
    
    db.commit()
    print(f"  Generated {total_readings} sensor readings for {len(businesses)} businesses.")
    return total_readings


def _update_business_ranking(db: Session, business: Business):
    """Recalculate and persist the business ranking based on stored data."""
    from app.routers.sensors import calculate_compliance_score, _get_latest_sensors_for_business
    
    # Use the same deduplicated sensor data as all other endpoints
    sensors_data = _get_latest_sensors_for_business(db, business.business_id)
    
    recommendations = db.query(RecommendationTracking).filter(
        RecommendationTracking.business_id == business.business_id
    ).all()
    
    recommendations_followed = sum(
        1 for r in recommendations 
        if r.status == RecommendationStatus.IMPLEMENTED
    )
    recommendations_total = len(recommendations)
    
    compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
    
    # Upsert business ranking
    existing = db.query(BusinessRanking).filter(
        BusinessRanking.business_id == business.business_id
    ).first()
    
    if existing:
        existing.overall_score = compliance["overall_score"]
        existing.rank_level = compliance["rank"]
        existing.recommendations_followed = recommendations_followed
        existing.recommendations_total = recommendations_total
    else:
        ranking = BusinessRanking(
            business_id=business.business_id,
            overall_score=compliance["overall_score"],
            rank=0,  # Will be recalculated after all businesses are processed
            rank_level=compliance["rank"],
            recommendations_followed=recommendations_followed,
            recommendations_total=recommendations_total,
        )
        db.add(ranking)


def generate_initial_compliance_data(db: Session, business: Business):
    """
    Generate initial demo compliance data for a newly registered business.
    
    Creates:
    - Sensor readings (same as daily generation)
    - Recommendation tracking entries (some implemented, some pending)
    - Business ranking entry
    
    This is gated by the GENERATE_DEMO_DATA_ON_REGISTER feature flag.
    """
    now = datetime.now(timezone.utc)

    # 1. Generate sensor readings
    readings = generate_sensor_readings_for_business(business, now)
    for reading_data in readings:
        db.add(SensorReading(
            business_id=reading_data["business_id"],
            sensor_id=reading_data["sensor_id"],
            sensor_type=reading_data["sensor_type"],
            location=reading_data["location"],
            reading_value=reading_data["reading_value"],
            unit=reading_data["unit"],
            status=reading_data["status"],
            recommendation_compliance=reading_data["recommendation_compliance"],
            timestamp=reading_data["timestamp"],
        ))

    # 2. Generate recommendation tracking entries
    store_type = business.store_type or "butcher_shop"
    climate_events = ["cold", "heat", "storm"]
    demo_recommendations = {
        "butcher_shop": {
            "cold": [
                ("Inspect refrigeration units to prevent overcooling", "high"),
                ("Verify backup power systems are operational", "medium"),
                ("Increase monitoring of frozen inventory temperatures", "medium"),
            ],
            "heat": [
                ("Increase refrigeration monitoring frequency", "high"),
                ("Check cooling systems performance", "medium"),
                ("Adjust delivery schedules to cooler hours", "low"),
            ],
            "storm": [
                ("Secure outdoor equipment and signage", "high"),
                ("Test backup power systems", "medium"),
                ("Review emergency procedures with staff", "low"),
            ],
        },
        "winery": {
            "cold": [
                ("Activate frost protection systems overnight", "high"),
                ("Monitor temperature sensors throughout vineyard", "medium"),
                ("Test backup generators for fermentation tanks", "medium"),
            ],
            "heat": [
                ("Increase irrigation frequency for vineyard", "high"),
                ("Monitor fermentation tank temperatures closely", "medium"),
                ("Adjust harvest schedule if needed", "low"),
            ],
            "storm": [
                ("Secure vineyard netting and trellises", "high"),
                ("Protect harvested grapes from moisture exposure", "medium"),
                ("Review drainage systems", "low"),
            ],
        },
    }

    recs_config = demo_recommendations.get(store_type, demo_recommendations["butcher_shop"])
    rec_index = 0

    for event in climate_events:
        for rec_text, risk_level in recs_config.get(event, []):
            # Deterministic: first 2/3 of recommendations are implemented, rest pending
            status = (
                RecommendationStatus.IMPLEMENTED
                if rec_index % 3 != 2
                else RecommendationStatus.PENDING
            )
            db.add(RecommendationTracking(
                business_id=business.business_id,
                climate_event=event,
                recommendation_text=rec_text,
                status=status,
                risk_level=risk_level,
            ))
            rec_index += 1

    db.flush()

    # 3. Update business ranking
    _update_business_ranking(db, business)

    print(f"  ✅ Generated initial compliance data for business '{business.name}' (ID={business.business_id})")


if __name__ == "__main__":
    """Run the daily sensor generation manually."""
    db = SessionLocal()
    try:
        run_daily_sensor_generation(db)
    finally:
        db.close()
