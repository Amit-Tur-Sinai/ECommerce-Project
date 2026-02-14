# Setup Guide - Canopy

Complete guide to set up and run the Canopy application.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **Python 3.9+** installed ([Download](https://www.python.org/))
- ✅ **PostgreSQL** installed and running ([Download](https://www.postgresql.org/download/))
- ✅ **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone and Navigate to Project

```bash
cd ECommerce-Project
```

### 2. Start PostgreSQL Database

Make sure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Check Services or use pgAdmin
```

### 3. Backend Setup

#### 3.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 3.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_app

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars

# Weather Data CSV Path (relative to backend/)
CSV_PATH=final_processed_weather_data.csv
```

#### 3.3 Create Database

```bash
# Create the database if it doesn't exist
createdb weather_app
# Or using psql:
# psql postgres -c "CREATE DATABASE weather_app;"
```

#### 3.4 Initialize Database Tables

```bash
cd backend

# Create user and business tables
python app/init_db.py

# Load historical weather data
python app/db_setup.py

# Train ML models (this may take a few minutes)
python app/train_model.py
```

#### 3.5 Start Backend Server

```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Backend URLs:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)
- ReDoc: http://localhost:8000/redoc

### 4. Frontend Setup

Open a **new terminal window**:

#### 4.1 Install Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

#### 4.2 Start Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

**Frontend URL:** http://localhost:3000

### 5. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## 🧪 Testing the Application

### 1. Register a New User

1. Go to http://localhost:3000/register
2. Fill in the registration form:
   - Email: `test@example.com`
   - Password: `password123`
   - Business Name: `Test Business`
   - Store Type: `Butcher Shop`
   - City: `Chesterfield`
3. Click "Create Account"

### 2. Explore Features (Business User)

After registration, you'll be automatically logged in and can:
- View your **Dashboard** with compliance score, weather risks, and sensor status
- Click the **Recommendations** widget to see all implemented/pending items
- View **Analytics** with historical weather trends and export to CSV/PDF
- Monitor **Sensors** in real time
- Check your **Inbox** for notifications from your insurance provider

### 3. Try the Insurance View

Register a second user with the "Insurance" role to access:
- **Admin Dashboard** with business rankings overview
- **Portfolio** page with all insured businesses and violation flags
- **Policies** page to create/edit compliance thresholds and send warning notifications

## 📁 Project Structure

```
ECommerce-Project/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── routers/           # API endpoints (auth, users, sensors, insurance)
│   │   ├── models/            # Database ORM & ML models (.joblib)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── utils/             # Auth utilities
│   │   ├── config.py          # Feature flags
│   │   ├── schedule_tasks.py  # Scheduled job runner
│   │   └── ...                # Ingestion, training, sensor generation scripts
│   ├── main.py                # FastAPI entry point
│   ├── setup_cron.sh          # Cron job installer
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (create this)
│
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── pages/             # Dashboard, Analytics, Sensors, Portfolio, Policies, Inbox, etc.
│   │   ├── components/        # Header, Footer, forms, weather cards, route guards
│   │   ├── services/          # API clients (auth, sensors, insurance, notifications)
│   │   ├── context/           # AuthContext, ThemeContext
│   │   └── utils/             # Constants, formatters, export helpers
│   ├── package.json           # Node dependencies
│   └── vite.config.ts         # Vite configuration
│
├── docs/                       # Documentation
│   ├── SETUP.md                # This file
│   ├── backend-README.md
│   ├── frontend-README.md
│   └── SENSOR_DEVICE.md
│
└── notebooks/                  # Jupyter notebooks
```

## 🔧 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
python3 -m uvicorn main:app --reload --port 8001
```

**Database connection error:**
- Verify PostgreSQL is running: `pg_isready`
- Check `.env` file has correct credentials
- Ensure database exists: `psql -l | grep weather_app`

**Missing dependencies:**
```bash
cd backend
pip install -r requirements.txt
pip install email-validator  # If needed
```

**Tables don't exist:**
```bash
cd backend
python app/init_db.py
python app/db_setup.py
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts
```

**Dependencies not installing:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**TypeScript errors:**
- Restart TypeScript server in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- Clear cache: `rm -rf node_modules && npm install --legacy-peer-deps`

**Can't connect to backend:**
- Verify backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify Vite proxy in `vite.config.ts`

### Database Issues

**Database doesn't exist:**
```bash
createdb weather_app
```

**Reset database (WARNING: Deletes all data):**
```bash
cd backend
psql weather_app -c "DROP TABLE IF EXISTS users CASCADE; DROP TABLE IF EXISTS businesses CASCADE; DROP TABLE IF EXISTS weather_processed CASCADE;"
python app/init_db.py
python app/db_setup.py
```

## 📚 Additional Documentation

- **[Backend README](./backend-README.md)** - Backend API documentation
- **[Frontend README](./frontend-README.md)** - Frontend documentation
- **[Sensor Device](./SENSOR_DEVICE.md)** - Sensor device setup

## 🎯 Next Steps

1. ✅ Complete setup (you're here!)
2. ✅ Register a business user and explore the dashboard
3. ✅ Register an insurance user and explore the portfolio/policies
4. ⏭️ Configure sensors (see [SENSOR_DEVICE.md](./SENSOR_DEVICE.md))
5. ⏭️ Set up daily cron jobs (`cd backend && ./setup_cron.sh`)
6. ⏭️ Deploy to production

## 🛠️ Development Commands

### Backend
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000   # Start server
python app/init_db.py                               # Initialize DB
python app/db_setup.py                              # Load weather data
python app/train_model.py                           # Train models
python app/create_admin_user.py                     # Create admin user
python app/schedule_tasks.py train                  # Re-train models
python app/schedule_tasks.py ingest                 # Ingest weather data
python app/schedule_tasks.py generate_sensors       # Generate sensor data
```

### Frontend
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🔐 Security Notes

- **JWT Secret**: Change `JWT_SECRET_KEY` in production (use a strong random string)
- **CORS**: Currently allows `localhost:3000` - update for production
- **Database Password**: Use strong passwords in production
- **Environment Variables**: Never commit `.env` files to git

## 📝 Environment Variables Reference

### Backend (.env in `backend/` directory)

```env
DB_USER=postgres                    # PostgreSQL username
DB_PASSWORD=your_password           # PostgreSQL password
DB_HOST=localhost                   # Database host
DB_PORT=5432                        # Database port
DB_NAME=weather_app                 # Database name
JWT_SECRET_KEY=your-secret-key      # JWT signing key (min 32 chars)
CSV_PATH=final_processed_weather_data.csv  # Weather data file path
```

### Frontend (.env in `frontend/` directory - optional)

```env
VITE_API_URL=/api                   # API URL (defaults to /api proxy)
```

## 🎉 You're All Set!

The application should now be running. Visit http://localhost:3000 to get started!

For questions or issues, refer to the troubleshooting section above or check the specific documentation files.
