# Demo Sensor Device Documentation

## Overview

The demo sensor device simulates IoT sensor devices that monitor business operations and track compliance with weather risk recommendations. It generates realistic sensor readings and automatically updates compliance scores and business rankings.

> **📋 Setup Required:** Before using the sensor device, make sure you've completed the main setup steps outlined in [SETUP.md](./SETUP.md). This includes database configuration, table creation, and initial data setup.

## Features

- **Realistic Sensor Data Generation**: Generates sensor readings based on business type (butcher shop, winery)
- **Compliance Tracking**: Tracks which recommendations are being followed
- **Automatic Ranking**: Calculates and updates business rankings based on compliance scores
- **Configurable Compliance Rate**: Adjustable compliance rate for realistic data generation

## Database Models

The system uses three new database models:

1. **SensorReading**: Stores sensor readings with status and compliance information
2. **RecommendationTracking**: Tracks which recommendations are given and their implementation status
3. **BusinessRanking**: Stores calculated compliance scores and rankings for each business

## Usage

### Initialize Demo Data Only

To initialize demo businesses and generate initial sensor readings without running continuously:

**Option 1: Using the wrapper script (recommended)**
```bash
python3 run_sensor_device.py --init-only
```

**Option 2: Using PYTHONPATH**
```bash
PYTHONPATH=. python3 -m app.demo_sensor_device --init-only
```

**Option 3: Running directly**
```bash
cd /Users/yovel.hatan/Desktop/ECommerce-Project
PYTHONPATH=. python3 app/demo_sensor_device.py --init-only
```

### Run Continuous Simulation

To run the sensor device continuously (generates readings every 5 minutes by default):

**Option 1: Using the wrapper script (recommended)**
```bash
python3 run_sensor_device.py
```

**Option 2: Using PYTHONPATH**
```bash
PYTHONPATH=. python3 -m app.demo_sensor_device
```

### Options

- `--business-id BUSINESS_ID`: Monitor a specific business ID (default: all businesses)
- `--interval SECONDS`: Interval between sensor readings in seconds (default: 300 = 5 minutes)
- `--compliance-rate RATE`: Compliance rate (0.0-1.0) for generating realistic data (default: 0.85 = 85%)
- `--init-only`: Only initialize demo data, don't run continuous simulation

### Examples

```bash
# Run with custom interval (every 2 minutes)
python3 run_sensor_device.py --interval 120

# Monitor specific business with 90% compliance rate
python3 run_sensor_device.py --business-id 1 --compliance-rate 0.9

# Initialize demo data only
python3 run_sensor_device.py --init-only

# Using PYTHONPATH method
PYTHONPATH=. python3 -m app.demo_sensor_device --interval 120
PYTHONPATH=. python3 -m app.demo_sensor_device --business-id 1 --compliance-rate 0.9
```

## Sensor Types

### Butcher Shop Sensors
- Temperature sensors for refrigeration units (0-5°C)
- Temperature sensors for freezer units (-20 to -15°C)
- Humidity sensors for storage areas (40-70%)
- Power sensors for backup generators (80-100%)

### Winery Sensors
- Temperature sensors for fermentation tanks (10-18°C)
- Temperature sensors for tasting room (15-25°C)
- Humidity sensors for storage cellar (50-70%)
- Power sensors for backup generators (80-100%)

## Compliance Scoring

The compliance score is calculated using:

- **60% Sensor Compliance**: Based on sensor readings being within normal ranges
- **40% Recommendation Compliance**: Based on recommendations being implemented

Rank levels:
- **Excellent**: ≥90%
- **Good**: ≥75%
- **Fair**: ≥60%
- **Needs Improvement**: <60%

## API Endpoints

The sensor data is accessible through the following API endpoints:

- `GET /sensors/readings`: Get sensor readings for current user's business
- `GET /sensors/compliance`: Get compliance score and ranking
- `GET /sensors/compliance/ranking`: Get business rankings (top N businesses)

## Frontend Integration

The frontend automatically fetches sensor data and displays:
- Live sensor readings with status indicators
- Compliance scores and rankings
- Business rankings comparison
- Recommendation compliance status

Data refreshes every 30 seconds automatically.

## Database Setup

Make sure your database is set up and migrations are run:

```bash
# The tables will be created automatically when the app starts
# Or manually:
python -c "from app.database import engine, Base; from app.models.db_models import *; Base.metadata.create_all(bind=engine)"
```

## Troubleshooting

### No sensor readings appearing

1. Make sure the demo sensor device has been run at least once with `--init-only`
2. Check that businesses exist in the database
3. Verify database connection settings

### Rankings not updating

1. Ensure the sensor device is running continuously
2. Check that sensor readings are being generated
3. Verify that recommendations exist for businesses

### Compliance scores seem incorrect

1. Check the compliance rate setting (default 85%)
2. Verify sensor readings are within expected ranges
3. Ensure recommendations are being tracked in the database
