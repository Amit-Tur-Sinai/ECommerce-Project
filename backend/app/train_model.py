import pandas as pd
import joblib
import os
import numpy as np
from sqlalchemy import create_engine
from xgboost import XGBClassifier
from dotenv import load_dotenv  # You need to install python-dotenv

# --- CONFIGURATION ---
load_dotenv()

USER = os.getenv("DB_USER", "postgres")
PASS = os.getenv("DB_PASSWORD", "password")
HOST = os.getenv("DB_HOST", "localhost")
PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "weather_app")

DB_STR = f"postgresql://{USER}:{PASS}@{HOST}:{PORT}/{DB_NAME}"
SAVE_DIR = "app/models/weather_models"
TARGETS = ["has_cold", "has_fog", "has_storm", "has_heat"]

# We still keep this list to explicitly remove metadata that might be numeric 
# (like 'Event_Ids' or 'Latitude' if you don't want them)
IGNORE_COLS = [
    'Date', 'City', 'State', 
    'HasExtremeEvent', 'EventCount', 'Events', 'Event_Types', 
    'Event_Severities', 'Event_Ids'
] + TARGETS 

def train():
    os.makedirs(SAVE_DIR, exist_ok=True)
    engine = create_engine(DB_STR)
    
    print("1. Fetching data from DB...")
    try:
        df = pd.read_sql("SELECT * FROM weather_processed", engine)
    except Exception as e:
        print(f"❌ Error connecting to DB: {e}")
        return

    # --- SAFETY FIX: CLEAN THE DATA ---
    # 1. Drop columns we explicitly don't want
    df_clean = df.drop(columns=[c for c in IGNORE_COLS if c in df.columns], errors='ignore')
    
    # 2. STRICTLY keep only numeric columns
    # This guarantees no text columns (like 'Event_Severities') accidentally sneak in
    X = df_clean.select_dtypes(include=[np.number, bool])
    
    feature_cols = list(X.columns)
    print(f"   Training on {len(feature_cols)} features: {feature_cols[:5]}...")

    print("\n2. Training Models...")
    for target in TARGETS:
        if target not in df.columns:
            print(f"⚠️ Warning: Target '{target}' not found. Skipping.")
            continue
            
        print(f"   > Training {target}...")
        y = df[target]
        
        # Calculate class imbalance
        # (Add a small epsilon 1e-6 to avoid division by zero if target is empty)
        pos_count = y.sum()
        neg_count = len(y) - pos_count
        scale = neg_count / (pos_count + 1e-6)
        
        model = XGBClassifier(
            n_estimators=100, 
            max_depth=6, 
            learning_rate=0.1,
            scale_pos_weight=scale, 
            eval_metric='logloss'
        )
        model.fit(X, y)
        
        # Save
        joblib.dump({
            "model": model, 
            "features": feature_cols,
            "target": target
        }, f"{SAVE_DIR}/{target}.joblib")
        
    print(f"✅ Done. Models saved in {SAVE_DIR}/")

if __name__ == "__main__":
    train()