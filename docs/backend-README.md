# Backend - Canopy API

This is the backend service for the Canopy application. It provides a FastAPI-based REST API for weather risk assessment, business recommendations, user management, and sensor monitoring.

## 📂 Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI app (moved to backend/main.py)
│   ├── database.py               # Database connection and session management
│   ├── db_setup.py               # Database initialization and weather data loading
│   ├── init_db.py                # Initialize user/business tables
│   ├── predict.py                # ML model prediction logic
│   ├── recommendation.py         # Recommendation generation
│   ├── train_model.py            # Model training script
│   ├── daily_ingest.py           # Daily weather data ingestion
│   ├── daily_ingest_all_cities.py # Batch city data ingestion
│   ├── schedule_tasks.py         # Scheduled task runner
│   ├── create_admin_user.py      # Admin user creation utility
│   ├── demo_sensor_device.py     # Sensor device simulation
│   ├── routers/                  # API route handlers
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── users.py              # User management endpoints
│   │   ├── sensors.py            # Sensor monitoring endpoints
│   │   └── insurance.py          # Insurance-related endpoints
│   ├── models/                   # Database models and ML models
│   │   ├── db_models.py          # SQLAlchemy models
│   │   └── weather_models/       # Trained ML models (.joblib files)
│   ├── schemas/                  # Pydantic schemas
│   │   ├── auth_schemas.py       # Authentication schemas
│   │   └── db_schemas.py         # Database schemas
│   └── utils/                    # Utility modules
│       └── auth.py               # Authentication utilities
├── main.py                       # FastAPI application entry point
├── requirements.txt              # Python dependencies
├── tests/                        # Test files
│   └── test_db.py
├── run_sensor_device.py          # Sensor device runner script
├── show_sensor_row.py            # Utility to view sensor readings
└── *.md                          # Backend documentation files
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL installed and running
- All Python dependencies installed

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # Database
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=weather_app

   # JWT Secret (change in production!)
   JWT_SECRET_KEY=your-super-secret-key-change-in-production

   # Weather data CSV path (relative to backend/)
   CSV_PATH=final_processed_weather_data.csv
   ```

3. **Initialize the database:**
   ```bash
   cd backend
   python app/init_db.py          # Create user/business tables
   python app/db_setup.py         # Load weather data
   python app/train_model.py      # Train ML models
   ```

4. **Start the server:**
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/profile` - Delete user account

### Weather Recommendations
- `GET /recommend/{city_name}` - Get weather risk recommendations

### Sensors
- `GET /sensors/compliance` - Get compliance score
- `GET /sensors/readings` - Get sensor readings
- `POST /sensors/readings` - Create sensor reading

### Insurance (Admin/Insurance role only)
- Various insurance-related endpoints (see `/docs` for details)

## 🔧 Development

### Running Tests
```bash
cd backend
python -m pytest tests/
```

### Database Migrations
The application uses SQLAlchemy with automatic table creation. To recreate tables:
```bash
cd backend
python -c "from app.database import engine, Base; from app.models import db_models; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
```

### Scheduled Tasks
To run scheduled tasks manually:
```bash
cd backend
python app/schedule_tasks.py train    # Train models
python app/schedule_tasks.py ingest   # Ingest daily data
```

## 📖 Documentation

- [SETUP.md](./SETUP.md) - Complete setup and installation guide
- [SENSOR_DEVICE.md](./SENSOR_DEVICE.md) - Sensor device documentation

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Business, Insurance, Admin)
- CORS middleware configured for frontend

## 🧪 Testing

Run the test suite:
```bash
cd backend
python -m pytest tests/
```

## 📝 Notes

- The backend uses relative imports (`from app.xxx import yyy`) which work correctly when running from the `backend/` directory
- ML models are stored in `app/models/weather_models/`
- Database connection is managed through `app/database.py`
- All API routes are organized in `app/routers/`
