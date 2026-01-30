import pandas as pd
import joblib
from xgboost import XGBClassifier
from app.daily_ingest import get_features_for_city

MODEL_PATH = "app/models/weather_models"
TARGETS = ["has_cold", "has_fog", "has_storm", "has_heat"]
IGNORE_COLS = [
    'Date', 'City', 'State',
    'HasExtremeEvent', 'EventCount', 'Events', 'Event_Types',
    'Event_Severities', 'Event_Ids'
] + TARGETS

def get_event_probabilities(city_name: str) -> dict:
    """
    PREDICTS probability of extreme weather events for the given city.
    
    Uses ML models trained on historical data to predict the probability of:
    - Cold events (min temp < 5°C)
    - Fog events (humidity > 90%)
    - Storm events (wind > 50 km/h OR precipitation > 20mm)
    - Heat events (max temp >= 35°C OR above city-specific threshold)
    
    Predictions are based on:
    - Yesterday's actual weather data (from OpenMeteo API)
    - Historical weather patterns (last 14 days from database)
    - Calculated features (lags, rolling means, seasonal patterns)
    
    Returns a dictionary with keys: "cold", "fog", "storm", "heat"
    Each value is a probability between 0.0 and 1.0
    """
    # 1. Get features for the city (uses yesterday's weather + historical patterns)
    df = get_features_for_city(city_name)
    if df is None or df.empty:
        return {}

    row = df.iloc[0]

    # 2. Prepare feature vector for prediction
    X = row.drop(labels=[col for col in IGNORE_COLS if col in row.index]).to_frame().T

    results = {}
    for target in TARGETS:
        # Dynamically load latest model
        loaded = joblib.load(f"{MODEL_PATH}/{target}.joblib")
        model = loaded["model"]
        features = loaded["features"]
        X_model = X[features].copy()

        # Ensure numeric columns
        for col in X_model.columns:
            X_model[col] = pd.to_numeric(X_model[col], errors='coerce')

        # Fix for XGBoost compatibility - add missing use_label_encoder attribute
        # This handles models trained with older XGBoost versions that had this parameter
        if isinstance(model, XGBClassifier) and not hasattr(model, 'use_label_encoder'):
            # Set the attribute to False to match old behavior
            model.use_label_encoder = False

        prob = model.predict_proba(X_model)[0][1]  # probability of class 1
        results[target] = round(float(prob), 4)

    # Transform keys from "has_cold" -> "cold" for API consistency
    return {k.replace("has_", ""): v for k, v in results.items()}
