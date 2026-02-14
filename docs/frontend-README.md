# Canopy Frontend

A modern React frontend for the Canopy API, built with TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS and dark mode
- 🔐 User authentication (register/login) with role-based access
- 📊 Business dashboard with compliance scores and weather risk recommendations
- 📈 Analytics page with historical weather data and export options
- 🔧 Real-time sensor monitoring
- 🏢 Insurance portfolio management with compliance tracking
- 📋 Policy management with violation detection
- 🔔 In-app notification inbox for business users
- 👤 User profile management
- ⚡ Fast development with Vite
- 🎯 Type-safe with TypeScript

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Form validation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/          # Header, Footer, LoadingSpinner, ErrorMessage, route guards
│   ├── weather/         # WeatherRiskCard, RecommendationList, ProbabilityGauge, RiskLevelBadge
│   └── forms/           # LoginForm, RegisterForm
├── pages/               # Page components
│   ├── DashboardPage    # Business user dashboard (compliance, risks, sensors)
│   ├── AnalyticsPage    # Weather analytics with charts and export
│   ├── SensorMonitoringPage # Real-time sensor readings
│   ├── AdminPage        # Insurance agent dashboard
│   ├── PortfolioPage    # Insured business portfolio
│   ├── PoliciesPage     # Policy management (create, edit, delete)
│   ├── InboxPage        # Business user notification inbox
│   ├── ProfilePage      # User profile
│   ├── LoginPage        # Login
│   ├── RegisterPage     # Registration
│   ├── LandingPage      # Public landing page
│   └── AboutUsPage      # About us
├── services/            # API services
│   ├── api.ts           # Axios instance with interceptors
│   ├── auth.ts          # Authentication API calls
│   ├── sensors.ts       # Sensor and compliance API calls
│   ├── insurance.ts     # Insurance portfolio, policies, risk assessments
│   ├── weather.ts       # Weather data API calls
│   └── notifications.ts # Notification inbox API calls
├── context/             # React context providers
│   ├── AuthContext.tsx   # Authentication state
│   └── ThemeContext.tsx  # Dark/light theme state
├── hooks/               # Custom React hooks
│   ├── useWeather.ts    # Weather data fetching hook
│   └── useScrollAnimation.ts # Scroll animation hook
└── utils/               # Utility functions
    ├── constants.ts     # API URL, app constants
    ├── formatters.ts    # Date/time formatting
    ├── exportUtils.ts   # CSV/PDF export helpers
    └── clsx.ts          # Class name utility
```

## API Integration

The frontend communicates with the following backend endpoint groups:

**Authentication** — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

**Users** — `GET /users/profile`, `PUT /users/profile`, `DELETE /users/account`

**Sensors** — `GET /sensors/readings`, `GET /sensors/compliance`, `GET /sensors/recommendations`

**Insurance** — `GET /insurance/portfolio`, `GET /insurance/policies`, `POST /insurance/policies`, `PUT /insurance/policies/{id}`, `DELETE /insurance/policies/{id}`, `POST /insurance/notify-violation`

**Notifications** — `GET /auth/notifications`, `GET /auth/notifications/unread-count`, `PUT /auth/notifications/{id}/read`, `PUT /auth/notifications/read-all`

**Weather** — `GET /recommend/{city_name}`

See the backend Swagger docs at `http://localhost:8000/docs` for full API details.

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Development

The app uses Vite's proxy configuration to forward `/api/*` requests to the backend during development. Make sure your backend is running on port 8000.
