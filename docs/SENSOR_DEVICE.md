# Sensor Device Documentation

## Overview

The sensor device simulator generates realistic IoT sensor readings for demo and development purposes. It monitors business operations, tracks compliance with weather risk recommendations, and updates compliance scores and rankings automatically.

> **Prerequisites:** Complete the main setup steps in [SETUP.md](./SETUP.md) (database configuration, table creation, initial data) before using the sensor device.

## Features

- Generates realistic sensor readings based on business type (butcher shop or winery)
- Tracks recommendation implementation status
- Calculates and updates business compliance scores and rankings
- Configurable compliance rate and reading interval

## Database Models

The sensor system uses three models:

| Model | Purpose |
|-------|---------|
| **SensorReading** | Stores sensor readings with value, status, and compliance info |
| **RecommendationTracking** | Tracks recommendations and their implementation status |
| **BusinessRanking** | Stores calculated compliance scores and rank levels |

## Usage

All commands should be run from the `backend/` directory.

### Initialize Demo Data

Generate initial sensor readings without running continuously:

```bash
python3 run_sensor_device.py --init-only
```

### Run Continuous Simulation

Generate sensor readings on an interval (default: every 5 minutes):

```bash
python3 run_sensor_device.py
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--business-id ID` | Monitor a specific business | All businesses |
| `--interval SECONDS` | Time between readings | 300 (5 min) |
| `--compliance-rate RATE` | Compliance rate (0.0–1.0) | 0.85 (85%) |
| `--init-only` | Initialize data only, then exit | Off |

### Examples

```bash
# Generate readings every 2 minutes
python3 run_sensor_device.py --interval 120

# Monitor a specific business with 90% compliance
python3 run_sensor_device.py --business-id 1 --compliance-rate 0.9

# Initialize demo data only
python3 run_sensor_device.py --init-only
```

## Sensor Types

### Butcher Shop

| Sensor | Type | Normal Range |
|--------|------|-------------|
| Refrigeration units | Temperature | 0–5 °C |
| Freezer units | Temperature | -20 to -15 °C |
| Storage areas | Humidity | 40–70% |
| Backup generators | Power | 80–100% |

### Winery

| Sensor | Type | Normal Range |
|--------|------|-------------|
| Fermentation tanks | Temperature | 10–18 °C |
| Tasting room | Temperature | 15–25 °C |
| Storage cellar | Humidity | 50–70% |
| Backup generators | Power | 80–100% |

## Compliance Scoring

The overall compliance score is a weighted average of:

- **Sensor health (60%)** — percentage of sensors reporting readings within normal ranges
- **Recommendation compliance (40%)** — percentage of recommendations marked as implemented

Rank levels:

| Rank | Score |
|------|-------|
| Excellent | 90% or above |
| Good | 75–89% |
| Fair | 60–74% |
| Needs Improvement | Below 60% |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /sensors/readings` | Sensor readings for the current user's business |
| `GET /sensors/compliance` | Compliance score and rank |
| `GET /sensors/recommendations` | All recommendation tracking items |
| `GET /sensors/compliance/ranking` | Business rankings (admin/insurance only) |

## Troubleshooting

**No sensor readings appearing**
1. Run the sensor device at least once with `--init-only`
2. Verify businesses exist in the database
3. Check database connection settings in `.env`

**Rankings not updating**
1. Ensure the sensor device is running continuously (or via cron)
2. Confirm sensor readings are being generated
3. Verify recommendations exist for the business

**Compliance scores seem incorrect**
1. Check the compliance rate setting (default 85%)
2. Verify sensor readings are within expected ranges
3. Ensure recommendation tracking entries exist in the database
