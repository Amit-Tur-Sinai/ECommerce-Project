# Canopy Frontend

A modern React frontend for the Canopy API, built with TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 User authentication (register/login)
- 📊 Weather risk dashboard
- 🌦️ Detailed weather recommendations
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
├── components/        # Reusable components
│   ├── common/      # Header, Footer, Loading, etc.
│   ├── weather/     # Weather-specific components
│   └── forms/       # Form components
├── pages/           # Page components
├── services/        # API services
├── context/         # React context providers
├── hooks/           # Custom React hooks
└── utils/           # Utility functions
```

## API Integration

The frontend expects the following backend endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /users/profile` - Update user profile
- `GET /recommend/{city_name}` - Get weather recommendations

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Development

The app uses Vite's proxy configuration to forward `/api/*` requests to the backend during development. Make sure your backend is running on port 8000.
