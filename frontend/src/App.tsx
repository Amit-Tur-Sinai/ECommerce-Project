import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SensorMonitoringPage } from '@/pages/SensorMonitoringPage';
import { AdminPage } from '@/pages/AdminPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { PoliciesPage } from '@/pages/PoliciesPage';
import { AboutUsPage } from '@/pages/AboutUsPage';
import { InboxPage } from '@/pages/InboxPage';
import { AdminRoute } from '@/components/common/AdminRoute';
import { BusinessRoute } from '@/components/common/BusinessRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const { user } = useAuth();

  // Determine default redirect based on user role
  const getDefaultRedirect = () => {
    if (!user) return '/dashboard';
    if (user.role === 'Insurance' || user.role === 'Admin') return '/admin';
    return '/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRedirect()} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={getDefaultRedirect()} replace /> : <RegisterPage />}
      />
      <Route
        path="/dashboard"
        element={
          <BusinessRoute>
            <DashboardPage />
          </BusinessRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <BusinessRoute>
            <AnalyticsPage />
          </BusinessRoute>
        }
      />
      <Route
        path="/sensors"
        element={
          <BusinessRoute>
            <SensorMonitoringPage />
          </BusinessRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/insurance/portfolio"
        element={
          <AdminRoute>
            <PortfolioPage />
          </AdminRoute>
        }
      />
      <Route
        path="/insurance/policies"
        element={
          <AdminRoute>
            <PoliciesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <BusinessRoute>
            <InboxPage />
          </BusinessRoute>
        }
      />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
              <Header />
              <main className="flex-1">
                <AppRoutes />
              </main>
              <Footer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
