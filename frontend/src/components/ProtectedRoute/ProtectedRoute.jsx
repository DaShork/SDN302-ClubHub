import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.jsx';

/* Protected route guard.

   Supported props:
   - children: content to render when access is granted
   - requiredRole: string OR array of role strings. If supplied, the user's role_id
     must be one of them. Falsy values (undefined/null/empty array) skip the check.
   - requiredPermission: string OR array of permission strings from `rolePermissions`.
     - With one value it behaves as `has(role, permission)`.
     - With an array of length 1 it behaves as `hasAny([permission])`.
     - Use `permissionMode="all"` with an array to require every permission.
   - permissionMode: "any" (default) | "all".
   - fallback: optional route string to navigate to when access is denied. Defaults
     to "/" so unauthorised users do not get stuck on the login screen.

   The decision tree is:
     1. Loading?       -> spinner
     2. Not auth?      -> /login (preserving original location in state)
     3. Auth OK, no required role/perm?  -> render
     4. Required role/perm provided?      -> render if match, else fallback
*/

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  permissionMode = 'any',
  fallback = '/',
}) {
  const { isAuthenticated, loading, role, can, canAny, canAll } = useAuth();
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

  /* ---- Role check ---- */
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role)) {
      return <Navigate to={fallback} replace />;
    }
  }

  /* ---- Permission check ---- */
  if (requiredPermission) {
    const perms = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];
    const ok =
      permissionMode === 'all' ? canAll(perms) : perms.length === 1 ? can(perms[0]) : canAny(perms);
    if (!ok) {
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}
