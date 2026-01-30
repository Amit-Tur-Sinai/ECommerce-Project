#!/usr/bin/env python3
"""Show a specific sensor reading row in detail."""

import sys
from sqlalchemy import text
from app.database import SessionLocal
from app.models.db_models import SensorReading, Business

def show_row(reading_id=None):
    db = SessionLocal()
    try:
        if reading_id:
            # Get specific row by ID
            reading = db.query(
                SensorReading,
                Business.name.label('business_name')
            ).join(
                Business, SensorReading.business_id == Business.business_id, isouter=True
            ).filter(
                SensorReading.reading_id == reading_id
            ).first()
            
            if not reading:
                print(f"No sensor reading found with ID: {reading_id}")
                return
            
            sr = reading[0]
            business_name = reading[1]
        else:
            # Get the most recent row
            reading = db.query(
                SensorReading,
                Business.name.label('business_name')
            ).join(
                Business, SensorReading.business_id == Business.business_id, isouter=True
            ).order_by(
                SensorReading.timestamp.desc()
            ).first()
            
            if not reading:
                print("No sensor readings found in the database.")
                return
            
            sr = reading[0]
            business_name = reading[1]
        
        # Display the row in detail
        print("\n" + "="*80)
        print("SENSOR READING DETAILS")
        print("="*80)
        print(f"\nReading ID:        {sr.reading_id}")
        print(f"Business ID:       {sr.business_id}")
        print(f"Business Name:     {business_name or 'N/A'}")
        print(f"Sensor ID:         {sr.sensor_id}")
        print(f"Sensor Type:       {sr.sensor_type}")
        print(f"Location:          {sr.location}")
        print(f"Reading Value:     {sr.reading_value} {sr.unit}")
        print(f"Status:            {sr.status}")
        print(f"Compliance:        {sr.recommendation_compliance}")
        print(f"Timestamp:         {sr.timestamp}")
        print("\n" + "="*80 + "\n")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    # Get reading ID from command line argument, or show most recent
    reading_id = int(sys.argv[1]) if len(sys.argv) > 1 else None
    show_row(reading_id)
