# Canopy

A comprehensive weather risk assessment platform that connects businesses with insurance companies through AI-powered weather risk intelligence. Canopy uses machine learning to predict weather-related risks, provides tailored recommendations to businesses, and gives insurance companies real-time visibility into compliance and risk levels.

## Demos
Demo videos showcasing the application’s functionality are available in the Demos folder.
Please download the video files to view the demonstrations.

## Features

- **Weather Risk Assessment** - AI-powered predictions for cold, storm, and heat events
- **Business-Specific Recommendations** - Tailored advice for different business types (butcher shops, wineries)
- **Real-time Dashboard** - Monitor weather risks and compliance scores
- **Sensor Monitoring** - Track compliance with deterministic sensor data
- **History & Documentation** - Historical risk records for insurance claims with CSV/PDF export
- **Insurance Company Interface** - Business portfolio management, policies, and risk assessment
- **Multi-role Support** - Business users, Insurance agents.

## Architecture: Data Persistence

| Data Type | Source | Update Frequency |
|-----------|--------|-----------------|
| **Weather predictions** | ML models (XGBoost) + OpenMeteo API | Daily ingestion |
| **Recommendations** | Weather model + AI API (Qwen) | Daily generation |
| **Sensor readings** | Daily sensor generation job | Once per day (6 AM) |
| **Compliance scores** | Calculated from stored sensors + recommendations | On read (deterministic) |
| **Business rankings** | Derived from compliance data | Updated with sensor generation |

### Model Selection

The model selection process for weather prediction, including the evaluation and comparison of different machine learning algorithms, can be found in the `notebooks/Model_Selection_Notebook.ipynb` file. This notebook contains the detailed analysis, hyperparameter tuning, and performance metrics that led to the selection of **XGBoost** as the final model for predicting cold, storm, and heat events.

### Policy Management

Policies let insurance agents set **compliance thresholds** for individual businesses. When a business's compliance score drops below its policy threshold, it is flagged as a **violation** across the platform.

**What is a policy?**

A policy is a rule created by an insurance agent that says: *"This business must maintain at least X% compliance."* For example, an agent might set a 75% threshold for a butcher shop — if its compliance score falls to 70%, the policy is violated.

**How policies work:**

| Concept | Description |
|---------|-------------|
| **Threshold** | The minimum compliance score a business must maintain (e.g., 75%) |
| **Current Score** | The business's live compliance score (calculated from sensors + recommendations) |
| **Gap** | The difference between current score and threshold (positive = above, negative = below) |
| **Violated** | `true` when current score < threshold |

**Where violations appear:**

- **Portfolio page** — Businesses below their threshold show a red "Below Policy" warning badge, a red-tinted card border, and a "Policy Violations" counter in the stats bar
- **Policies page** — Each policy shows a live progress bar with a threshold marker, the current score, the gap, and a "Compliant" (green) or "Violated" (red) badge. Summary cards at the top count total compliant vs violated policies

**Example:**

An insurance agent creates a policy for *"Amarillo Prime Cuts"* with a **threshold of 80%**. The business currently has a compliance score of **72%**. The policy status will show:

- Threshold: 80% | Current Score: 72% | Gap: **-8.0%**
- Status: **Violated** (red badge)
- The business will be flagged on the Portfolio page with a "Below Policy (80%)" warning

**Notifications for violations:**

Insurance agents can send a **warning notification** to businesses that violate their policy threshold. A "Send Warning" button appears on violated business cards in both the Portfolio and Policies pages.

- Clicking the button creates a notification containing the business name, current score, threshold, gap, underperforming categories, and actionable recommendations.
- The notification appears in the business user's **Inbox** (accessible via the bell icon in the header). Unread notifications show a red badge on the bell.
- Clicking a notification in the Inbox expands the full warning message and automatically marks it as read.
- All notifications are stored in the `notifications` table and can be retrieved via the `GET /auth/notifications` endpoint.

### Daily Report (Planned Feature)

A daily report will be sent to each user at 7-8 AM containing:
- Weather forecast for their city
- Active recommendations (same as dashboard view)

For now, the dashboard itself serves as the daily view.

### Recommendation System

- Recommendations are based on the ML weather model predictions + AI-generated explanations
- **High/Critical risk**: Up to 5 recommendations
- **Medium risk**: Up to 3 recommendations
- **Low risk**: Up to 1 recommendation
- Recommendations use the user's registered city and store type (no manual filtering)

### Compliance Score Calculation

The compliance score measures how well a business follows weather risk guidelines. It combines two components:

**Overall Score = (Sensor Score × 60%) + (Recommendation Score × 40%)**

| Component | Weight | How it's calculated |
|-----------|--------|-------------------|
| **Sensor Score** | 60% | Percentage of sensors in "normal" status (from the last 24 hours) |
| **Recommendation Score** | 40% | Percentage of recommendations marked as "Implemented" |

**Rank Levels:**

| Score | Rank |
|-------|------|
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Fair |
| 0–59 | Needs Improvement |
| No data | No Data |

**Example:** A butcher shop called *"Brooklyn Fresh Meats"* has 5 sensors and 9 recommendations:

- 4 out of 5 sensors are in normal status → Sensor Score = 80%
- 6 out of 9 recommendations are implemented → Recommendation Score = 66.7%
- **Overall = (80 × 0.6) + (66.7 × 0.4) = 48 + 26.7 = 74.7 → "Fair"**

The score is calculated **on-the-fly** every time the dashboard loads (via `GET /sensors/compliance`), using stored sensor readings and recommendation tracking data. This ensures scores are always deterministic and consistent.

#### Demo Data on Registration

When `GENERATE_DEMO_DATA_ON_REGISTER` is set to `True` in `backend/app/config.py` (default for POC), new business users automatically receive:

- **5 sensor readings** (tailored to their store type — butcher shop or winery)
- **9 recommendation tracking entries** (6 implemented, 3 pending)
- **A calculated compliance ranking**

Set this flag to `False` in production when real sensor data is available.

## Project Structure

```
ECommerce-Project/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── routers/     # API endpoints (auth, insurance, sensors, users)
│   │   ├── models/      # Database ORM & ML models
│   │   ├── schemas/     # Pydantic request/response schemas
│   │   ├── utils/       # Auth utilities
│   │   ├── predict.py   # ML prediction (cold, storm, heat)
│   │   ├── recommendation.py   # AI recommendation generation
│   │   ├── daily_sensor_generation.py  # Daily sensor data (placeholder for IoT)
│   │   ├── schedule_tasks.py   # Scheduled job runner
│   │   └── init_db.py   # DB schema + seed data
│   ├── main.py          # FastAPI entry point
│   └── requirements.txt
│
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── pages/       # Dashboard, Analytics, Sensors, Admin, Portfolio, Policies, Profile
│   │   ├── components/  # Header, forms, weather components
│   │   ├── services/    # API client (auth, weather, sensors, insurance)
│   │   └── utils/       # Constants, formatters, export utilities
│   └── package.json
│
└── docs/                # Documentation
    ├── SETUP.md         # Complete setup guide
    ├── backend-README.md
    ├── frontend-README.md
    └── SENSOR_DEVICE.md
```

## Quick Start

**See [SETUP.md](./docs/SETUP.md) for complete setup instructions.**

### Quick Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python app/init_db.py          # Create tables + seed demo data
python app/db_setup.py         # Load weather CSV data
python app/train_model.py      # Train ML models
python3 -m uvicorn main:app --reload --port 8000

# Generate sensor data (run once, then daily via cron)
python app/daily_sensor_generation.py

# Frontend (new terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Visit http://localhost:3000 to see the application.

### Scheduled Tasks (Manual)

```bash
# Train ML models
python app/schedule_tasks.py train

# Ingest weather data for all cities
python app/schedule_tasks.py ingest

# Generate sensor readings for all businesses
python app/schedule_tasks.py generate_sensors
```

### Automated Cron Jobs

To run these tasks automatically every day, use the included setup script:

```bash
cd backend
chmod +x setup_cron.sh
./setup_cron.sh
```

This installs three cron jobs:

| Time     | Task                  | Log file            |
|----------|-----------------------|---------------------|
| 2:00 AM  | Train ML models       | `logs/train.log`    |
| 3:00 AM  | Ingest weather data   | `logs/ingest.log`   |
| 4:00 AM  | Generate sensor data  | `logs/sensors.log`  |

To verify: `crontab -l`
To remove all Canopy cron jobs: `./setup_cron.sh --remove`
To view logs: `tail -f backend/logs/train.log`

## Documentation

- **[SETUP.md](./docs/SETUP.md)** - Complete setup and installation guide
- **[Backend README](./docs/backend-README.md)** - Backend API documentation
- **[Frontend README](./docs/frontend-README.md)** - Frontend documentation
- **[Sensor Device](./docs/SENSOR_DEVICE.md)** - Sensor device setup

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **XGBoost** - Machine learning models
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching

## Founders

- Amit Tur Sinai
- Neri Nigberg
- Nitzan Melchior
- Yael Tolkowsky
- Yovel Hatan
