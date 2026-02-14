from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.utils.auth import get_current_user, get_current_admin_user
from app.models.db_models import (
    User, SensorReading, RecommendationTracking, 
    BusinessRanking, RecommendationStatus, Business
)

router = APIRouter(prefix="/sensors", tags=["sensors"])


def _get_latest_sensors_for_business(db: Session, business_id: int, hours: int = 24) -> List[dict]:
    """Get the latest reading per sensor for a business (deduplicated).
    
    This is the single source of truth used by both the readings endpoint
    and the compliance calculation, so they always agree.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    latest_readings = db.query(
        SensorReading.sensor_id,
        func.max(SensorReading.timestamp).label('max_timestamp')
    ).filter(
        SensorReading.business_id == business_id,
        SensorReading.timestamp >= cutoff_time
    ).group_by(SensorReading.sensor_id).all()
    
    sensors = []
    for sensor_id, max_timestamp in latest_readings:
        reading = db.query(SensorReading).filter(
            SensorReading.sensor_id == sensor_id,
            SensorReading.timestamp == max_timestamp
        ).first()
        if reading:
            sensors.append({
                "sensor_id": reading.sensor_id,
                "sensor_type": reading.sensor_type,
                "location": reading.location,
                "reading_value": reading.reading_value,
                "unit": reading.unit,
                "status": reading.status,
                "timestamp": reading.timestamp,
                "recommendation_compliance": reading.recommendation_compliance == "compliant",
            })
    return sensors


# Severity weights: normal contributes full points, warning half, critical zero
STATUS_WEIGHTS = {"normal": 100, "warning": 50, "critical": 0}


def _sensor_health(sensors: List[dict], sensor_type: str) -> float:
    """Return the weighted health score for sensors of the given type.
    
    Each sensor is scored by severity:
      normal = 100, warning = 50, critical = 0
    The result is the average across all matching sensors (0-100).
    """
    filtered = [s for s in sensors if s.get("sensor_type") == sensor_type]
    if not filtered:
        return 0.0
    total_points = sum(STATUS_WEIGHTS.get(s["status"], 0) for s in filtered)
    return total_points / len(filtered)


def calculate_compliance_score(sensors: List[dict], recommendations_followed: int, recommendations_total: int) -> dict:
    """Calculate compliance score based on sensor readings and recommendations.
    
    Each category uses only the relevant sensor type with severity weighting:
      - temperature_control   = weighted avg of Temperature sensors (normal=100, warning=50, critical=0)
      - equipment_maintenance  = weighted avg of Power sensors
      - safety_protocols       = % of recommendations implemented
      - inventory_management   = weighted avg of Humidity sensors
    
    This is deterministic -- given the same inputs, always returns the same output.
    """
    total_sensors = len(sensors)
    if total_sensors == 0 and recommendations_total == 0:
        return {
            "overall_score": 0,
            "category_scores": {
                "temperature_control": 0,
                "equipment_maintenance": 0,
                "safety_protocols": 0,
                "inventory_management": 0,
            },
            "recommendations_followed": 0,
            "recommendations_total": 0,
            "rank": "No Data",
        }
    
    # Per-type sensor health scores (direct percentage, no multiplier)
    temp_score = _sensor_health(sensors, "Temperature")
    power_score = _sensor_health(sensors, "Power")
    humidity_score = _sensor_health(sensors, "Humidity")
    
    recommendation_score = (recommendations_followed / recommendations_total) * 100 if recommendations_total > 0 else 0
    
    # Category scores — direct percentages
    category_scores = {
        "temperature_control": int(temp_score) if any(s.get("sensor_type") == "Temperature" for s in sensors) else 0,
        "equipment_maintenance": int(power_score) if any(s.get("sensor_type") == "Power" for s in sensors) else 0,
        "safety_protocols": int(recommendation_score) if recommendations_total > 0 else 0,
        "inventory_management": int(humidity_score) if any(s.get("sensor_type") == "Humidity" for s in sensors) else 0,
    }
    
    # Overall score: average of all non-zero category scores
    active_scores = [v for v in category_scores.values() if v > 0]
    overall_score = int(sum(active_scores) / len(active_scores)) if active_scores else 0
    
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
        "overall_score": overall_score,
        "category_scores": category_scores,
        "recommendations_followed": recommendations_followed,
        "recommendations_total": recommendations_total,
        "rank": rank,
    }


@router.get("/readings")
async def get_sensor_readings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    hours: int = Query(default=24, description="Hours of history to retrieve")
):
    """Get sensor readings for the current user's business.
    
    Returns only data stored in the database. Sensor readings are generated
    once daily by the daily_sensor_generation job -- never on the fly.
    """
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="Business not found")
    
    sensors = _get_latest_sensors_for_business(db, current_user.business_id, hours)
    
    # Serialize timestamps for JSON response
    for s in sensors:
        s["timestamp"] = s["timestamp"].isoformat() if hasattr(s["timestamp"], "isoformat") else s["timestamp"]
    
    return {"sensors": sensors}


@router.get("/compliance")
async def get_compliance_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance score and ranking for the current user's business.
    
    Uses the same deduplicated sensor data as the readings endpoint,
    so the numbers always match what the user sees.
    """
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Use the same deduplicated sensor data as the readings endpoint
    sensors_data = _get_latest_sensors_for_business(db, current_user.business_id)
    
    # Get recommendation tracking
    recommendations = db.query(RecommendationTracking).filter(
        RecommendationTracking.business_id == current_user.business_id
    ).all()
    
    recommendations_followed = sum(
        1 for r in recommendations 
        if r.status == RecommendationStatus.IMPLEMENTED
    )
    recommendations_total = len(recommendations)
    
    compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
    return compliance


@router.get("/compliance/ranking")
async def get_business_ranking(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=10, description="Number of businesses to return"),
    sort_order: str = Query(default="desc", description="Sort order: 'asc' or 'desc'")
):
    """Get ranking of businesses by compliance score - Admin/Insurance only.
    
    Calculated deterministically from stored data.
    """
    # Get all businesses
    all_businesses = db.query(Business).all()
    business_scores = []
    
    for business in all_businesses:
        # Use the same deduplicated sensor data as the readings endpoint
        sensors_data = _get_latest_sensors_for_business(db, business.business_id)
        
        # Get recommendation tracking
        recommendations = db.query(RecommendationTracking).filter(
            RecommendationTracking.business_id == business.business_id
        ).all()
        
        recommendations_followed = sum(
            1 for r in recommendations 
            if r.status == RecommendationStatus.IMPLEMENTED
        )
        recommendations_total = len(recommendations)
        
        compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
        
        business_scores.append({
            "business_id": business.business_id,
            "business_name": business.name,
            "store_type": business.store_type,
            "city": business.city,
            "score": compliance["overall_score"],
            "rank_level": compliance["rank"],
            "recommendations_followed": recommendations_followed,
            "recommendations_total": recommendations_total,
        })
    
    # Sort by score
    reverse = sort_order != "asc"
    business_scores.sort(key=lambda x: x["score"], reverse=reverse)
    
    # Assign ranks
    for i, biz_data in enumerate(business_scores, 1):
        biz_data["rank"] = i
    
    # Separate user's business if they have one
    user_business_id = current_user.business_id
    user_rank_data = None
    rankings = []
    
    for biz_data in business_scores:
        if user_business_id and biz_data["business_id"] == user_business_id:
            user_rank_data = biz_data
        else:
            rankings.append(biz_data)
    
    rankings = rankings[:limit]
    
    return {
        "rankings": rankings,
        "your_business": user_rank_data,
    }
