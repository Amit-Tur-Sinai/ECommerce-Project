"""
Daily ingestion script for all cities in the database.
This script fetches yesterday's weather data for all cities in weather_processed table
and inserts them into the database.

Run this daily via cron job or scheduler.
"""
import sys
from sqlalchemy import text
from app.daily_ingest import get_db_engine, run_daily_update

def get_all_cities():
    """Get list of all unique cities from the database."""
    engine = get_db_engine()
    query = text("""
        SELECT DISTINCT "City" 
        FROM weather_processed 
        ORDER BY "City"
    """)
    with engine.connect() as conn:
        results = conn.execute(query).fetchall()
    return [row[0] for row in results]

def ingest_all_cities():
    """Fetch and insert weather data for all cities."""
    cities = get_all_cities()
    
    if not cities:
        print("⚠️ No cities found in database. Please run db_setup.py first to load initial data.")
        return
    
    print(f"Found {len(cities)} cities in database.")
    print(f"Cities: {', '.join(cities[:10])}{'...' if len(cities) > 10 else ''}")
    print("\nStarting daily ingestion for all cities...\n")
    
    success_count = 0
    error_count = 0
    
    for city in cities:
        try:
            print(f"Processing {city}...", end=" ")
            run_daily_update(city)
            success_count += 1
            print("✅")
        except Exception as e:
            error_count += 1
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Completed: {success_count} successful, {error_count} errors")

if __name__ == "__main__":
    ingest_all_cities()
