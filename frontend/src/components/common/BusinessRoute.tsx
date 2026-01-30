import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from './LoadingSpinner';

interface BusinessRouteProps {
  children: React.ReactNode;
}

export const BusinessRoute = ({ children }: BusinessRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only Business users can access business pages (not Insurance/Admin)
  if (user.role !== 'Business') {
    // Redirect Insurance/Admin users to admin page
    if (user.role === 'Insurance' || user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
