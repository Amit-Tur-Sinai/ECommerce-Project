# Weather Risk Recommendations App

A comprehensive weather risk assessment platform that helps businesses protect themselves from weather-related risks using AI-powered predictions and actionable recommendations.

## 🌟 Features

- **Weather Risk Assessment** - AI-powered predictions for cold, fog, storm, and heat events
- **Business-Specific Recommendations** - Tailored advice for different business types (butcher shops, wineries, etc.)
- **Real-time Dashboard** - Monitor weather risks and compliance scores
- **Interactive Weather Map** - Visualize risks across multiple locations
- **Forecast Timeline** - 7-14 day weather forecasts with probability trends
- **Cost Savings Calculator** - Estimate savings from following recommendations
- **Export & Reports** - Generate PDF and CSV reports
- **Sensor Monitoring** - Track compliance with sensor data
- **Multi-role Support** - Business users, Insurance agents, and Admins

## 📂 Project Structure

```
ECommerce-Project/
├── backend/              # Python FastAPI backend
│   ├── app/             # Application code
│   │   ├── routers/    # API endpoints
│   │   ├── models/     # Database & ML models
│   │   └── ...
│   ├── main.py         # FastAPI entry point
│   └── requirements.txt
│
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── ...
│   └── package.json
│
└── docs/               # Documentation
    ├── SETUP.md        # Complete setup guide
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
python app/init_db.py
python app/db_setup.py
python app/train_model.py
python3 -m uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Visit http://localhost:3000 to see the application.

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
- **Recharts** - Data visualization
- **Leaflet** - Interactive maps

## 📝 License

[Add your license here]

## 👥 Founders

- Amit Tur Sinai
- Neri Nigberg
- Nitzan Melchior
- Yael Tokolovsky
- Yovel Hatan
