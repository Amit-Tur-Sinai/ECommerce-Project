# Canopy

A comprehensive weather risk assessment platform that connects businesses with insurance companies through AI-powered weather risk intelligence. Canopy uses machine learning to predict weather-related risks, provides tailored recommendations to businesses, and gives insurance companies real-time visibility into compliance and risk levels.

## 🌟 Features

- **Weather Risk Assessment** - AI-powered predictions for cold, storm, and heat events
- **Business-Specific Recommendations** - Tailored advice for different business types (butcher shops, wineries)
- **Real-time Dashboard** - Monitor weather risks and compliance scores
- **Sensor Monitoring** - Track compliance with deterministic sensor data
- **History & Documentation** - Historical risk records for insurance claims with CSV/PDF export
- **Insurance Company Interface** - Business portfolio management, policies, and risk assessment
- **Multi-role Support** - Business users, Insurance agents, and Admins

## 🏗️ Architecture: Data Persistence

**All data in Canopy is persistent and deterministic.** Nothing is randomly generated on page load or refresh. Every piece of data the user sees comes from the database:

| Data Type | Source | Update Frequency |
|-----------|--------|-----------------|
| **Weather predictions** | ML models (XGBoost) + OpenMeteo API | Daily ingestion |
| **Recommendations** | Weather model + AI API (Qwen) | Daily generation |
| **Sensor readings** | Daily sensor generation job | Once per day (6 AM) |
| **Compliance scores** | Calculated from stored sensors + recommendations | On read (deterministic) |
| **Business rankings** | Derived from compliance data | Updated with sensor generation |

### Daily Data Pipeline

The following scheduled jobs run daily to keep data fresh:

1. **Weather data ingestion** (`daily_ingest_all_cities.py`) - Fetches yesterday's weather from OpenMeteo API
2. **Sensor data generation** (`daily_sensor_generation.py`) - Generates deterministic sensor readings per business
3. **Recommendations** - Generated from weather model predictions + AI explanation API

> **Note:** The sensor data generation is currently a **placeholder for real IoT integration**. In production, this would be replaced by real sensor data received via an API endpoint. See `backend/app/daily_sensor_generation.py` for details.

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

### Daily Report (Planned Feature)

A daily report will be sent to each user at 7-8 AM containing:
- Weather forecast for their city
- Active recommendations (same as dashboard view)

For now, the dashboard itself serves as the daily view.

## 📂 Project Structure

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

## 🚀 Quick Start

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

### Scheduled Tasks

```bash
# Daily weather ingestion
python app/schedule_tasks.py ingest

# Daily sensor generation (placeholder for real IoT data)
python app/schedule_tasks.py generate_sensors

# Weekly model training
python app/schedule_tasks.py train
```

## 📖 Documentation

- **[SETUP.md](./docs/SETUP.md)** - Complete setup and installation guide
- **[Backend README](./docs/backend-README.md)** - Backend API documentation
- **[Frontend README](./docs/frontend-README.md)** - Frontend documentation
- **[Sensor Device](./docs/SENSOR_DEVICE.md)** - Sensor device setup

## 🛠️ Technology Stack

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

## 📝 License

[Add your license here]

## 👥 Founders

- Amit Tur Sinai
- Neri Nigberg
- Nitzan Melchior
- Yael Tolkowsky
- Yovel Hatan
