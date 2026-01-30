from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.predict import get_event_probabilities
from app.recommendation import generate_recommendations
from app.routers import auth, users, sensors, insurance
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Weather Recommendation API",
    description="API for weather risk assessment and business recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sensors.router)
app.include_router(insurance.router)


@app.get("/")
async def root():
    return {"message": "Weather Recommendation API", "version": "1.0.0"}


@app.get("/recommend/{city_name}")
async def recommend(
    city_name: str,
    store_type: str = Query(default="butcher_shop", description="Store type: butcher_shop or winery"),
    risk_threshold: float = Query(default=0.2, description="Probability threshold for showing recommendations (0.0-1.0). Default: 0.2 (20%) for demo")
):
    """
    Endpoint that returns recommendations for a given city.
    
    Uses ML models to PREDICT the probability of extreme weather events based on:
    - Yesterday's actual weather data (from OpenMeteo API)
    - Historical weather patterns (last 14 days from database)
    - Calculated features (lags, rolling means, seasonal patterns)
    
    The models predict future risk probabilities. Only returns recommendations 
    for events with predicted probability >= risk_threshold.
    
    Args:
        city_name: Name of the city
        store_type: Type of store (butcher_shop or winery)
        risk_threshold: Minimum probability to show recommendations (default: 0.5)
    """
    probabilities = get_event_probabilities(city_name)
    if not probabilities:
        raise HTTPException(
            status_code=404,
            detail=f"No weather data available for {city_name}"
        )

    result = generate_recommendations(probabilities, store_type=store_type, risk_threshold=risk_threshold)
    return result
