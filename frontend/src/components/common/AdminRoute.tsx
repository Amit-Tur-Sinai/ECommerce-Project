import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow Admin and Insurance roles to access admin pages
  if (user.role !== 'Admin' && user.role !== 'Insurance') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
