import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.jsx';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="protected-loading__spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role_id) {
    const hasRole = profile.role_id === requiredRole;
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
