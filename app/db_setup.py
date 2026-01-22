import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv  # You need to install python-dotenv

# 1. Load secrets from the .env file
load_dotenv()

# 2. Read variables (with defaults just in case)
USER = os.getenv("DB_USER", "postgres")
PASS = os.getenv("DB_PASSWORD", "password")
HOST = os.getenv("DB_HOST", "localhost")
PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "weather_app")
CSV_PATH = os.getenv("CSV_PATH", "final_processed_weather_data.csv")

# 3. Construct the connection string dynamically
DB_STR = f"postgresql://{USER}:{PASS}@{HOST}:{PORT}/{DB_NAME}"

def setup_db():
    print("Reading processed CSV...")
    df = pd.read_csv(CSV_PATH)
    
    # Ensure Date is parsed correctly
    df['Date'] = pd.to_datetime(df['Date'])
    
    print("Connecting to Postgres...")
    engine = create_engine(DB_STR)
    
    # We save this to a table called 'weather_processed'
    # This table ALREADY has lags, rolling means, and labels
    print(f"Uploading {len(df)} rows...")
    df.to_sql('weather_processed', engine, index=False, if_exists='replace')
    print("Done!")

if __name__ == "__main__":
    setup_db()