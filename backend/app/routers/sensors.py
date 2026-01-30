from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import random
from app.database import get_db
from app.utils.auth import get_current_user, get_current_admin_user
from app.models.db_models import (
    User, SensorReading, RecommendationTracking, 
    BusinessRanking, RecommendationStatus
)

router = APIRouter(prefix="/sensors", tags=["sensors"])


def generate_mock_sensor_data(business_id: int, count: int = 5) -> List[dict]:
    """Generate mock sensor readings for demonstration."""
    sensor_types = [
        {"type": "Temperature", "unit": "°C", "normal_range": (0, 5)},
        {"type": "Humidity", "unit": "%", "normal_range": (40, 70)},
        {"type": "Power", "unit": "%", "normal_range": (80, 100)},
        {"type": "Temperature", "unit": "°C", "normal_range": (-20, -15)},
    ]
    
    sensors = []
    locations = [
        "Refrigeration Unit 1",
        "Refrigeration Unit 2",
        "Storage Area",
        "Backup Generator",
        "Freezer Unit",
    ]
    
    for i in range(min(count, len(locations))):
        sensor_type = sensor_types[i % len(sensor_types)]
        value_range = sensor_type["normal_range"]
        
        # 80% chance of normal, 15% warning, 5% critical
        rand = random.random()
        if rand < 0.8:
            status = "normal"
            value = random.uniform(value_range[0], value_range[1])
        elif rand < 0.95:
            status = "warning"
            # Value slightly outside normal range
            value = random.uniform(value_range[1], value_range[1] + 3)
        else:
            status = "critical"
            value = random.uniform(value_range[1] + 3, value_range[1] + 10)
        
        sensors.append({
            "sensor_id": f"{sensor_type['type'][:4].upper()}-{str(i+1).zfill(3)}",
            "sensor_type": sensor_type["type"],
            "location": locations[i],
            "reading_value": round(value, 1),
            "unit": sensor_type["unit"],
            "status": status,
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(0, 60))).isoformat(),
            "recommendation_compliance": status == "normal",
        })
    
    return sensors


def calculate_compliance_score(sensors: List[dict], recommendations_followed: int, recommendations_total: int) -> dict:
    """Calculate compliance score based on sensor readings and recommendations."""
    total_sensors = len(sensors)
    if total_sensors == 0:
        return {
            "overall_score": 0,
            "category_scores": {},
            "recommendations_followed": 0,
            "recommendations_total": 0,
            "rank": "Poor",
        }
    
    normal_count = sum(1 for s in sensors if s["status"] == "normal")
    sensor_score = (normal_count / total_sensors) * 100
    
    recommendation_score = (recommendations_followed / recommendations_total) * 100 if recommendations_total > 0 else 0
    
    overall_score = int((sensor_score * 0.6) + (recommendation_score * 0.4))
    
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
        "category_scores": {
            "temperature_control": int(sensor_score * 0.95),
            "equipment_maintenance": int(sensor_score * 0.92),
            "safety_protocols": int(recommendation_score * 0.98),
            "inventory_management": int(recommendation_score * 0.85),
        },
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
    """Get sensor readings for the current user's business."""
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Get recent sensor readings from database
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    # Get latest reading for each sensor
    latest_readings = db.query(
        SensorReading.sensor_id,
        func.max(SensorReading.timestamp).label('max_timestamp')
    ).filter(
        SensorReading.business_id == current_user.business_id,
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
                "timestamp": reading.timestamp.isoformat(),
                "recommendation_compliance": reading.recommendation_compliance == "compliant",
            })
    
    # If no readings found, generate mock data for demo
    if not sensors:
        sensors_data = generate_mock_sensor_data(current_user.business_id)
        return {"sensors": sensors_data}
    
    return {"sensors": sensors}


@router.get("/compliance")
async def get_compliance_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance score and ranking for the current user's business."""
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Get recent sensor readings (last 24 hours)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_readings = db.query(SensorReading).filter(
        SensorReading.business_id == current_user.business_id,
        SensorReading.timestamp >= cutoff_time
    ).all()
    
    # Get recommendation tracking
    recommendations = db.query(RecommendationTracking).filter(
        RecommendationTracking.business_id == current_user.business_id
    ).all()
    
    recommendations_followed = sum(
        1 for r in recommendations 
        if r.status == RecommendationStatus.IMPLEMENTED
    )
    recommendations_total = len(recommendations)
    
    # If no data exists, use mock data
    if not recent_readings and not recommendations:
        sensors = generate_mock_sensor_data(current_user.business_id)
        recommendations_followed = random.randint(15, 22)
        recommendations_total = 22
        compliance = calculate_compliance_score(sensors, recommendations_followed, recommendations_total)
        return compliance
    
    # Calculate from real data
    sensors_data = [
        {
            "status": r.status,
            "recommendation_compliance": r.recommendation_compliance == "compliant"
        }
        for r in recent_readings
    ]
    
    compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
    return compliance


@router.get("/compliance/ranking")
async def get_business_ranking(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=10, description="Number of businesses to return")
):
    """Get ranking of businesses by compliance score - Admin/Insurance only. All calculated in real-time."""
    from app.models.db_models import Business
    
    # Insurance/Admin users don't need business_id - they can see all businesses
    
    # Get all businesses
    all_businesses = db.query(Business).limit(limit + 5).all()  # Get a few extra in case user's business is filtered
    
    # Calculate compliance scores for ALL businesses in real-time (same method as /compliance endpoint)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    business_scores = []
    
    for business in all_businesses:
        # Get recent sensor readings (last 24 hours) - same as compliance endpoint
        recent_readings = db.query(SensorReading).filter(
            SensorReading.business_id == business.business_id,
            SensorReading.timestamp >= cutoff_time
        ).all()
        
        # Get recommendation tracking - same as compliance endpoint
        recommendations = db.query(RecommendationTracking).filter(
            RecommendationTracking.business_id == business.business_id
        ).all()
        
        recommendations_followed = sum(
            1 for r in recommendations 
            if r.status == RecommendationStatus.IMPLEMENTED
        )
        recommendations_total = len(recommendations)
        
        # Calculate score from real data - same method as compliance endpoint
        if recent_readings or recommendations:
            sensors_data = [
                {
                    "status": r.status,
                    "recommendation_compliance": r.recommendation_compliance == "compliant"
                }
                for r in recent_readings
            ]
            compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
        else:
            # Fallback to mock if no data
            sensors = generate_mock_sensor_data(business.business_id)
            recommendations_followed = random.randint(15, 22)
            recommendations_total = 22
            compliance = calculate_compliance_score(sensors, recommendations_followed, recommendations_total)
        
        business_scores.append({
            "business_id": business.business_id,
            "business_name": business.name,
            "score": compliance["overall_score"],
            "rank_level": compliance["rank"],
            "recommendations_followed": recommendations_followed,
            "recommendations_total": recommendations_total,
        })
    
    # Sort by score descending
    business_scores.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign ranks
    for i, biz_data in enumerate(business_scores, 1):
        biz_data["rank"] = i
    
    # For Insurance/Admin users, show all businesses (no "your_business")
    # For Business users, separate their business from others
    user_business_id = current_user.business_id
    user_rank_data = None
    rankings = []
    
    for biz_data in business_scores:
        # Only separate if user has a business_id (Business users)
        if user_business_id and biz_data["business_id"] == user_business_id:
            user_rank_data = {
                "rank": biz_data["rank"],
                "business_name": biz_data["business_name"],
                "score": biz_data["score"],
                "rank_level": biz_data["rank_level"],
                "recommendations_followed": biz_data["recommendations_followed"],
                "recommendations_total": biz_data["recommendations_total"],
            }
        else:
            rankings.append({
                "rank": biz_data["rank"],
                "business_name": biz_data["business_name"],
                "score": biz_data["score"],
                "rank_level": biz_data["rank_level"],
                "recommendations_followed": biz_data["recommendations_followed"],
                "recommendations_total": biz_data["recommendations_total"],
            })
    
    # Limit rankings list
    rankings = rankings[:limit]
    
    # If user has a business but it wasn't found in calculations, calculate it separately
    if user_business_id and not user_rank_data:
        recent_readings = db.query(SensorReading).filter(
            SensorReading.business_id == user_business_id,
            SensorReading.timestamp >= cutoff_time
        ).all()
        
        recommendations = db.query(RecommendationTracking).filter(
            RecommendationTracking.business_id == user_business_id
        ).all()
        
        recommendations_followed = sum(
            1 for r in recommendations 
            if r.status == RecommendationStatus.IMPLEMENTED
        )
        recommendations_total = len(recommendations)
        
        if recent_readings or recommendations:
            sensors_data = [
                {
                    "status": r.status,
                    "recommendation_compliance": r.recommendation_compliance == "compliant"
                }
                for r in recent_readings
            ]
            user_compliance = calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)
        else:
            sensors = generate_mock_sensor_data(user_business_id)
            recommendations_followed = random.randint(15, 22)
            recommendations_total = 22
            user_compliance = calculate_compliance_score(sensors, recommendations_followed, recommendations_total)
        
        user_business = db.query(Business).filter(
            Business.business_id == user_business_id
        ).first()
        
        business_name = user_business.name if user_business else (user_business_id or "Your Business")
        
        # Calculate rank position
        user_score = user_compliance["overall_score"]
        user_rank_position = sum(1 for biz in business_scores if biz["score"] > user_score) + 1
        
        user_rank_data = {
            "rank": user_rank_position,
            "business_name": business_name,
            "score": user_score,
            "rank_level": user_compliance["rank"],
            "recommendations_followed": recommendations_followed,
            "recommendations_total": recommendations_total,
        }
    
    # For Insurance/Admin users without a business, set your_business to None or empty
    if not user_business_id:
        user_rank_data = None
    
    return {
        "rankings": rankings,
        "your_business": user_rank_data,
    }
