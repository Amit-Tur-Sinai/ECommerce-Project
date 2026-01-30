"""
Scheduling helper script for model training and data ingestion.

This script can be used with cron or task schedulers to:
1. Train models weekly (run train_model.py)
2. Ingest daily data for all cities (run daily_ingest_all_cities.py)
"""
import sys
import subprocess
from datetime import datetime

def train_models():
    """Train all ML models."""
    print(f"[{datetime.now()}] Starting model training...")
    try:
        result = subprocess.run(
            [sys.executable, "app/train_model.py"],
            cwd=".",
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"[{datetime.now()}] ✅ Model training completed successfully")
            print(result.stdout)
        else:
            print(f"[{datetime.now()}] ❌ Model training failed")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error training models: {e}")
        return False
    return True

def ingest_daily_data():
    """Ingest weather data for all cities."""
    print(f"[{datetime.now()}] Starting daily data ingestion...")
    try:
        result = subprocess.run(
            [sys.executable, "app/daily_ingest_all_cities.py"],
            cwd=".",
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"[{datetime.now()}] ✅ Daily ingestion completed successfully")
            print(result.stdout)
        else:
            print(f"[{datetime.now()}] ❌ Daily ingestion failed")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error ingesting data: {e}")
        return False
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python app/schedule_tasks.py train    # Train models")
        print("  python app/schedule_tasks.py ingest   # Ingest daily data")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "train":
        success = train_models()
        sys.exit(0 if success else 1)
    elif command == "ingest":
        success = ingest_daily_data()
        sys.exit(0 if success else 1)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
