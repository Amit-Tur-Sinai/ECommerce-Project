import pandas as pd
import joblib
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
    Returns probability predictions for cold, fog, storm, heat events
    for the given city based on yesterday's weather and recent history.
    
    Returns a dictionary with keys: "cold", "fog", "storm", "heat"
    """
    # 1. Get features for the city (does NOT add to DB)
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

        prob = model.predict_proba(X_model)[0][1]  # probability of class 1
        results[target] = round(float(prob), 4)

    # Transform keys from "has_cold" -> "cold" for API consistency
    return {k.replace("has_", ""): v for k, v in results.items()}
