import { Navigate, useLocation } from "react-router-dom";
import { clearUserSession, getLoginPath, getStoredUser, isSessionExpired } from "./session";

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user || isSessionExpired(user)) {
    clearUserSession();
    return <Navigate to={getLoginPath(location.pathname)} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
