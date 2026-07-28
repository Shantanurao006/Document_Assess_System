import axios from "axios";
import {
  clearUserSession,
  getLoginPath,
  getStoredUser,
  isSessionExpired,
} from "../auth/session";

// =====================================
// Backend Base URL
// =====================================
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// =====================================
// Axios Instance
// =====================================
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================
// Request Interceptor
// =====================================
API.interceptors.request.use(
  (config) => {
    const user = getStoredUser();

    if (user && isSessionExpired(user)) {
      clearUserSession();
      window.location.href = getLoginPath(window.location.pathname);
      return Promise.reject(new Error("Session expired"));
    }

    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================
// Response Interceptor
// =====================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject(error);
    }

    switch (error.response.status) {
      case 401:
        clearUserSession();

        if (window.location.pathname !== "/") {
          window.location.href = getLoginPath(window.location.pathname);
        }
        break;

      case 403:
        console.error("Forbidden");
        break;

      case 404:
        console.error("API Not Found");
        break;

      case 500:
        console.error("Internal Server Error");
        break;

      default:
        console.error(error.response.data);
    }

    return Promise.reject(error);
  }
);

export default API;
