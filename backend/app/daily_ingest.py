import os
import sys
import pandas as pd
import requests
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

USER = os.getenv("DB_USER", "postgres")
PASS = os.getenv("DB_PASSWORD", "password")
HOST = os.getenv("DB_HOST", "localhost")
PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "weather_app")
TABLE_NAME = "weather_processed"

DB_STR = f"postgresql://{USER}:{PASS}@{HOST}:{PORT}/{DB_NAME}"

# Default city if none provided
DEFAULT_CITY = {"Name": "Chesterfield", "Lat": 38.6572, "Lon": -90.6558}

# Raw columns needed from OpenMeteo
RAW_PARAMS = "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,pressure_msl_max,pressure_msl_min,pressure_msl_mean,cloud_cover_mean"

def get_db_engine():
    return create_engine(DB_STR)

def get_city_info(engine, city_name: str):
    """Fetch city info (lat/lon/state) from DB if it exists, else use default."""
    query = text(f"""
        SELECT "City", "State", "Latitude", "Longitude" 
        FROM {TABLE_NAME} 
        WHERE "City" = :city
        ORDER BY "Date" DESC
        LIMIT 1
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"city": city_name}).fetchone()
    if result:
        return {"Name": result[0], "State": result[1], "Lat": result[2], "Lon": result[3]}
    else:
        print(f"⚠️ City '{city_name}' not found in DB. Using default city.")
        return DEFAULT_CITY.copy()

def fetch_yesterday_raw(city_name: str = None):
    """Fetch yesterday's weather data from OpenMeteo for a given city."""
    engine = get_db_engine()
    city = get_city_info(engine, city_name or DEFAULT_CITY["Name"])

    date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": city['Lat'],
        "longitude": city['Lon'],
        "start_date": date,
        "end_date": date,
        "daily": RAW_PARAMS,
        "timezone": "auto"
    }
    try:
        res = requests.get(url, params=params).json()
        if 'daily' not in res:
            raise ValueError(f"API Error: {res}")
        row = {k: v[0] for k, v in res['daily'].items()}
        row['Date'] = pd.to_datetime(date)
        row['City'] = city['Name']
        row['State'] = city.get('State', 'MO')
        row['Latitude'] = city['Lat']
        row['Longitude'] = city['Lon']
        return row
    except Exception as e:
        print(f"❌ Error fetching API data: {e}")
        return None

def get_city_heat_threshold(engine, city_name):
    query = text(f"""
        SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY temperature_2m_max)
        FROM {TABLE_NAME}
        WHERE "City" = :city
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"city": city_name}).scalar()
    if result is None:
        return 35.0
    return result

def calculate_derived_features(df: pd.DataFrame):
    df['month'] = df['Date'].dt.month
    df['day_of_year'] = df['Date'].dt.dayofyear
    df['season'] = df['month'].apply(lambda x: 0 if x in [12,1,2] else 1 if x in [3,4,5] else 2 if x in [6,7,8] else 3)
    df['temp_range'] = df['temperature_2m_max'] - df['temperature_2m_min']
    df['pressure_range'] = df['pressure_msl_max'] - df['pressure_msl_min']
    df['humidity_range'] = df['relative_humidity_2m_max'] - df['relative_humidity_2m_min']
    for col in ['temperature_2m_mean', 'pressure_msl_mean', 'relative_humidity_2m_mean']:
        df[f'{col}_lag1'] = df[col].shift(1)
        df[f'{col}_lag3'] = df[col].shift(3)
        df[f'{col}_rolling7_mean'] = df[col].rolling(7).mean()
        df[f'{col}_rolling7_std'] = df[col].rolling(7).std()
    return df

def determine_labels(row, heat_threshold):
    has_cold = 1 if row['temperature_2m_min'] < 5 else 0
    has_fog = 1 if row['relative_humidity_2m_mean'] > 90 else 0
    has_storm = 1 if (row['wind_gusts_10m_max'] > 50 or row['precipitation_sum'] > 20) else 0
    cond_abs = row['temperature_2m_max'] >= 35
    cond_rel = (row['temperature_2m_max'] > heat_threshold) and (row['temperature_2m_max'] > 28)
    has_heat = 1 if (cond_abs or cond_rel) else 0
    return has_cold, has_fog, has_storm, has_heat

def get_features_for_city(city_name: str) -> pd.DataFrame:
    """
    Returns a single-row DataFrame with features ready for prediction for a given city.
    """
    engine = get_db_engine()
    raw_row = fetch_yesterday_raw(city_name)
    if raw_row is None:
        raise ValueError(f"No weather data available for '{city_name}'")
    
    query = f"""SELECT * FROM {TABLE_NAME} WHERE "City"='{city_name}' ORDER BY "Date" DESC LIMIT 14"""
    history_df = pd.read_sql(query, engine).sort_values("Date").reset_index(drop=True)
    combined = pd.concat([history_df, pd.DataFrame([raw_row])], ignore_index=True)
    processed = calculate_derived_features(combined)
    
    final_row = processed.iloc[[-1]].copy()
    heat_threshold = get_city_heat_threshold(engine, city_name)
    c, f, s, h = determine_labels(final_row.iloc[0], heat_threshold)
    final_row['has_cold'] = c
    final_row['has_fog'] = f
    final_row['has_storm'] = s
    final_row['has_heat'] = h
    final_row['HasExtremeEvent'] = bool(c + f + s + h > 0)
    final_row['EventCount'] = c + f + s + h
    for col in ['Events', 'Event_Types', 'Event_Severities', 'Event_Ids']:
        final_row[col] = final_row.get(col, "None")
    
    # Enforce DB column types dynamically
    inspector = inspect(engine)
    db_columns = {col['name']: col['type'] for col in inspector.get_columns(TABLE_NAME)}
    final_row = final_row[[col for col in final_row.columns if col in db_columns]]
    
    for col, col_type in db_columns.items():
        if col in final_row.columns:
            if "int" in str(col_type):
                final_row[col] = final_row[col].astype(int)
            elif "float" in str(col_type) or "double" in str(col_type):
                final_row[col] = final_row[col].astype(float)
            elif "bool" in str(col_type):
                final_row[col] = final_row[col].astype(bool)
            elif "date" in str(col_type) or "timestamp" in str(col_type):
                final_row[col] = pd.to_datetime(final_row[col])
            else:
                final_row[col] = final_row[col].astype(str)
    
    return final_row

def run_daily_update(city_name: str = "Chesterfield"):
    """Optional: append new observation to DB."""
    engine = get_db_engine()
    final_row = get_features_for_city(city_name)
    try:
        final_row.to_sql(TABLE_NAME, engine, if_exists='append', index=False)
        print(f"✅ New observation for {city_name} saved successfully.")
    except Exception as e:
        print(f"❌ Database Insert Error: {e}")


if __name__ == "__main__":
    city_name = sys.argv[1] if len(sys.argv) > 1 else "Chesterfield"
    run_daily_update(city_name)
