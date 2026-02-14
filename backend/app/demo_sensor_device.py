"""
Demo Sensor Device Script

This script simulates IoT sensor devices that monitor business operations
and track compliance with weather risk recommendations. It generates realistic
sensor readings and updates compliance scores and rankings.

Usage:
    # Option 1: Run from project root with PYTHONPATH
    PYTHONPATH=. python3 -m app.demo_sensor_device [--business-id BUSINESS_ID] [--interval SECONDS]
    
    # Option 2: Use the wrapper script
    python3 run_sensor_device.py [--business-id BUSINESS_ID] [--interval SECONDS]
    
    # Option 3: Run directly (if PYTHONPATH is set)
    python3 app/demo_sensor_device.py [--business-id BUSINESS_ID] [--interval SECONDS]
"""

import asyncio
import random
import argparse
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add parent directory to path to allow imports when running directly
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.db_models import (
    Business, SensorReading, RecommendationTracking, 
    BusinessRanking, RecommendationStatus
)
from app.recommendation import RECOMMENDATION_MAP


# Sensor configurations based on store type
SENSOR_CONFIGS = {
    "butcher_shop": [
        {"type": "Temperature", "unit": "°C", "normal_range": (0, 5), "location": "Refrigeration Unit 1", "sensor_id_prefix": "TEMP"},
        {"type": "Temperature", "unit": "°C", "normal_range": (0, 5), "location": "Refrigeration Unit 2", "sensor_id_prefix": "TEMP"},
        {"type": "Temperature", "unit": "°C", "normal_range": (-20, -15), "location": "Freezer Unit", "sensor_id_prefix": "FREEZ"},
        {"type": "Humidity", "unit": "%", "normal_range": (40, 70), "location": "Storage Area", "sensor_id_prefix": "HUMID"},
        {"type": "Power", "unit": "%", "normal_range": (80, 100), "location": "Backup Generator", "sensor_id_prefix": "POWER"},
    ],
    "winery": [
        {"type": "Temperature", "unit": "°C", "normal_range": (10, 18), "location": "Fermentation Tank 1", "sensor_id_prefix": "TEMP"},
        {"type": "Temperature", "unit": "°C", "normal_range": (10, 18), "location": "Fermentation Tank 2", "sensor_id_prefix": "TEMP"},
        {"type": "Humidity", "unit": "%", "normal_range": (50, 70), "location": "Storage Cellar", "sensor_id_prefix": "HUMID"},
        {"type": "Power", "unit": "%", "normal_range": (80, 100), "location": "Backup Generator", "sensor_id_prefix": "POWER"},
        {"type": "Temperature", "unit": "°C", "normal_range": (15, 25), "location": "Tasting Room", "sensor_id_prefix": "TEMP"},
    ],
}


def get_status_from_value(value: float, normal_range: tuple, sensor_type: str) -> str:
    """Determine sensor status based on reading value."""
    min_val, max_val = normal_range
    
    if sensor_type == "Power":
        # For power, lower is worse
        if value >= max_val * 0.95:
            return "normal"
        elif value >= max_val * 0.80:
            return "warning"
        else:
            return "critical"
    else:
        # For temperature/humidity, values outside range are problematic
        if min_val <= value <= max_val:
            return "normal"
        elif min_val - 2 <= value <= max_val + 2:
            return "warning"
        else:
            return "critical"


def generate_sensor_reading(
    db: Session,
    business_id: int,
    sensor_config: Dict,
    compliance_rate: float = 0.85
) -> SensorReading:
    """Generate a realistic sensor reading based on compliance rate."""
    normal_range = sensor_config["normal_range"]
    sensor_type = sensor_config["type"]
    
    # Determine if business is following recommendations
    is_compliant = random.random() < compliance_rate
    
    if is_compliant:
        # Compliant businesses have readings in normal range (with small variance)
        if sensor_type == "Power":
            value = random.uniform(normal_range[0] * 0.95, normal_range[1])
        else:
            value = random.uniform(normal_range[0], normal_range[1])
        status = "normal"
        compliance = "compliant"
    else:
        # Non-compliant businesses have readings outside normal range
        rand = random.random()
        if rand < 0.6:
            # Warning level - slightly outside range
            if sensor_type == "Power":
                value = random.uniform(normal_range[0] * 0.70, normal_range[0] * 0.90)
            else:
                value = random.uniform(normal_range[1] + 1, normal_range[1] + 3)
            status = "warning"
        else:
            # Critical level - far outside range
            if sensor_type == "Power":
                value = random.uniform(normal_range[0] * 0.50, normal_range[0] * 0.70)
            else:
                value = random.uniform(normal_range[1] + 3, normal_range[1] + 8)
            status = "critical"
        compliance = "non_compliant"
    
    # Generate sensor ID
    sensor_count = db.query(SensorReading).filter(
        SensorReading.business_id == business_id,
        SensorReading.sensor_id.like(f"{sensor_config['sensor_id_prefix']}-%")
    ).count()
    sensor_id = f"{sensor_config['sensor_id_prefix']}-{str(sensor_count + 1).zfill(3)}"
    
    reading = SensorReading(
        business_id=business_id,
        sensor_id=sensor_id,
        sensor_type=sensor_type,
        location=sensor_config["location"],
        reading_value=round(value, 1),
        unit=sensor_config["unit"],
        status=status,
        recommendation_compliance=compliance,
        timestamp=datetime.now(timezone.utc)
    )
    
    return reading


def calculate_compliance_score(
    db: Session,
    business_id: int
) -> Dict:
    """Calculate compliance score for a business."""
    # Get recent sensor readings (last 24 hours)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_readings = db.query(SensorReading).filter(
        SensorReading.business_id == business_id,
        SensorReading.timestamp >= cutoff_time
    ).all()
    
    if not recent_readings:
        return {
            "overall_score": 0,
            "rank": "Needs Improvement",
            "recommendations_followed": 0,
            "recommendations_total": 0,
        }
    
    # Calculate sensor compliance
    total_readings = len(recent_readings)
    normal_readings = sum(1 for r in recent_readings if r.status == "normal")
    sensor_score = (normal_readings / total_readings) * 100 if total_readings > 0 else 0
    
    # Get recommendation tracking
    recommendations = db.query(RecommendationTracking).filter(
        RecommendationTracking.business_id == business_id
    ).all()
    
    total_recommendations = len(recommendations)
    implemented_recommendations = sum(
        1 for r in recommendations 
        if r.status == RecommendationStatus.IMPLEMENTED
    )
    recommendation_score = (
        (implemented_recommendations / total_recommendations) * 100 
        if total_recommendations > 0 else 100
    )
    
    # Overall score: 60% sensor compliance, 40% recommendation compliance
    overall_score = (sensor_score * 0.6) + (recommendation_score * 0.4)
    
    # Determine rank
    if overall_score >= 90:
        rank = "Excellent"
    elif overall_score >= 75:
        rank = "Good"
    elif overall_score >= 60:
        rank = "Fair"
    else:
        rank = "Needs Improvement"
    
    return {
        "overall_score": round(overall_score, 1),
        "rank": rank,
        "recommendations_followed": implemented_recommendations,
        "recommendations_total": total_recommendations,
    }


def update_business_ranking(db: Session, business_id: int):
    """Update or create business ranking."""
    compliance_data = calculate_compliance_score(db, business_id)
    
    # Get all businesses and calculate their rankings
    all_businesses = db.query(Business).all()
    business_scores = []
    
    for business in all_businesses:
        biz_compliance = calculate_compliance_score(db, business.business_id)
        business_scores.append({
            "business_id": business.business_id,
            "score": biz_compliance["overall_score"],
        })
    
    # Sort by score descending
    business_scores.sort(key=lambda x: x["score"], reverse=True)
    
    # Update rankings
    for rank, biz_data in enumerate(business_scores, 1):
        ranking = db.query(BusinessRanking).filter(
            BusinessRanking.business_id == biz_data["business_id"]
        ).first()
        
        biz_compliance = calculate_compliance_score(db, biz_data["business_id"])
        
        if ranking:
            ranking.overall_score = biz_compliance["overall_score"]
            ranking.rank = rank
            ranking.rank_level = biz_compliance["rank"]
            ranking.recommendations_followed = biz_compliance["recommendations_followed"]
            ranking.recommendations_total = biz_compliance["recommendations_total"]
            ranking.last_updated = datetime.now(timezone.utc)
        else:
            ranking = BusinessRanking(
                business_id=biz_data["business_id"],
                overall_score=biz_compliance["overall_score"],
                rank=rank,
                rank_level=biz_compliance["rank"],
                recommendations_followed=biz_compliance["recommendations_followed"],
                recommendations_total=biz_compliance["recommendations_total"],
            )
            db.add(ranking)
    
    db.commit()


def generate_recommendations_for_business(
    db: Session,
    business: Business,
    climate_events: List[str] = None
):
    """Generate and track recommendations for a business."""
    if climate_events is None:
        climate_events = ["cold", "heat", "storm", "fog"]
    
    store_type = business.store_type or "butcher_shop"
    
    for event in climate_events:
        key = (event, store_type)
        if key in RECOMMENDATION_MAP:
            action_plan = RECOMMENDATION_MAP[key]
            
            # Check if recommendations already exist
            existing = db.query(RecommendationTracking).filter(
                RecommendationTracking.business_id == business.business_id,
                RecommendationTracking.climate_event == event
            ).first()
            
            if not existing:
                # Create tracking entries for each recommendation
                for rec_text in action_plan["recommendations"]:
                    # Randomly assign status (simulating real-world compliance)
                    compliance_rate = random.uniform(0.7, 0.95)  # 70-95% compliance
                    status = (
                        RecommendationStatus.IMPLEMENTED 
                        if random.random() < compliance_rate 
                        else RecommendationStatus.PENDING
                    )
                    
                    tracking = RecommendationTracking(
                        business_id=business.business_id,
                        climate_event=event,
                        recommendation_text=rec_text,
                        status=status,
                        risk_level=action_plan["risk_level"],
                    )
                    db.add(tracking)
    
    db.commit()


def simulate_sensor_readings(
    db: Session,
    business_id: Optional[int] = None,
    compliance_rate: float = 0.85
):
    """Simulate sensor readings for one or all businesses."""
    if business_id:
        businesses = db.query(Business).filter(Business.business_id == business_id).all()
    else:
        businesses = db.query(Business).all()
    
    if not businesses:
        print("No businesses found in database.")
        return
    
    for business in businesses:
        store_type = business.store_type or "butcher_shop"
        sensor_configs = SENSOR_CONFIGS.get(store_type, SENSOR_CONFIGS["butcher_shop"])
        
        # Generate readings for each sensor
        for sensor_config in sensor_configs:
            reading = generate_sensor_reading(db, business.business_id, sensor_config, compliance_rate)
            db.add(reading)
        
        print(f"Generated sensor readings for {business.name} (ID: {business.business_id})")
    
    db.commit()
    
    # Update rankings for all businesses
    print("Updating business rankings...")
    for business in businesses:
        update_business_ranking(db, business.business_id)
    
    print("Sensor simulation complete!")


def initialize_demo_data(db: Session):
    """Initialize demo data for businesses."""
    # Create demo businesses if they don't exist
    demo_businesses = [
        {"name": "Premium Butcher Shop", "store_type": "butcher_shop", "city": "New York"},
        {"name": "Artisan Meats Co", "store_type": "butcher_shop", "city": "Los Angeles"},
        {"name": "Valley Winery", "store_type": "winery", "city": "Napa"},
        {"name": "Mountain View Winery", "store_type": "winery", "city": "Sonoma"},
        {"name": "City Fresh Meats", "store_type": "butcher_shop", "city": "Chicago"},
    ]
    
    for biz_data in demo_businesses:
        existing = db.query(Business).filter(Business.name == biz_data["name"]).first()
        if not existing:
            business = Business(**biz_data)
            db.add(business)
            db.flush()
            
            # Generate recommendations for this business
            generate_recommendations_for_business(db, business)
            print(f"Created demo business: {biz_data['name']}")
    
    db.commit()


async def run_sensor_device(
    business_id: Optional[int] = None,
    interval: int = 300,  # 5 minutes default
    compliance_rate: float = 0.85
):
    """Run the sensor device simulation continuously."""
    print(f"Starting sensor device simulation (interval: {interval}s)")
    print(f"Monitoring business ID: {business_id if business_id else 'ALL'}")
    print(f"Compliance rate: {compliance_rate * 100:.1f}%")
    print("Press Ctrl+C to stop\n")
    
    db = SessionLocal()
    try:
        # Initialize demo data
        initialize_demo_data(db)
        
        while True:
            simulate_sensor_readings(db, business_id, compliance_rate)
            await asyncio.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopping sensor device...")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Demo Sensor Device")
    parser.add_argument(
        "--business-id",
        type=int,
        help="Specific business ID to monitor (default: all businesses)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Interval between sensor readings in seconds (default: 300)"
    )
    parser.add_argument(
        "--compliance-rate",
        type=float,
        default=0.85,
        help="Compliance rate (0.0-1.0) for generating realistic data (default: 0.85)"
    )
    parser.add_argument(
        "--init-only",
        action="store_true",
        help="Only initialize demo data, don't run continuous simulation"
    )
    
    args = parser.parse_args()
    
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    
    if args.init_only:
        db = SessionLocal()
        try:
            initialize_demo_data(db)
            simulate_sensor_readings(db, args.business_id, args.compliance_rate)
            print("Demo data initialized successfully!")
        finally:
            db.close()
    else:
        asyncio.run(run_sensor_device(args.business_id, args.interval, args.compliance_rate))


if __name__ == "__main__":
    main()
