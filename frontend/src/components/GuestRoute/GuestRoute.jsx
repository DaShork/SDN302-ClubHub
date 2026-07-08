import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.jsx';

/* Guest-only route guard. Authenticated users are redirected to either:
   1. The location they originally wanted to visit (preserved in `state.from`), OR
   2. The role-specific landing route from `rolePermissions.ROLE_DEFAULT_ROUTE`.

   This keeps `/login`, `/signup`, `/forgot-password`, `/reset-password`
   from being shown to signed-in users and routes them straight to a useful page. */

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading, landingRouteForRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="protected-loading__spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname ?? landingRouteForRole();
    return <Navigate to={from} replace />;
  }

  return children;
}
