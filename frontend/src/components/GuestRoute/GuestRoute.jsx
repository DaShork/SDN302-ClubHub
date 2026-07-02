import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.jsx';

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="protected-loading__spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  return children;
}
