import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearUserSession, getLoginPath, getStoredUser, isSessionExpired } from "./session";

function SessionTimeout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      return undefined;
    }

    const expireSession = () => {
      clearUserSession();
      navigate(getLoginPath(location.pathname), { replace: true });
    };

    if (isSessionExpired(user)) {
      expireSession();
      return undefined;
    }

    const timeoutId = window.setTimeout(
      expireSession,
      user.sessionExpiresAt - Date.now()
    );

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate]);

  return null;
}

export default SessionTimeout;
