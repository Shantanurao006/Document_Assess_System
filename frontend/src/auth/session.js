const SESSION_DURATION_MS = 15 * 60 * 1000;
const USER_STORAGE_KEY = "user";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const createUserSession = (user) => ({
  ...user,
  sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
});

export const isSessionExpired = (user = getStoredUser()) => {
  if (!user?.sessionExpiresAt) {
    return true;
  }

  return Date.now() >= user.sessionExpiresAt;
};

export const saveUserSession = (user) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(createUserSession(user)));
};

export const clearUserSession = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getLoginPath = (returnTo = window.location.pathname) => {
  const nextPath = `${returnTo}${window.location.search || ""}`;
  return `/login?next=${encodeURIComponent(nextPath)}`;
};
