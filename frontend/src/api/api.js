// src/api/api.js

import axios from "axios";

// =====================================
// Backend Base URL
// =====================================
const API_BASE_URL =
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
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (err) {
      console.error("Unable to parse user from localStorage", err);
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
        console.error("Unauthorized");

        localStorage.removeItem("user");

        if (window.location.pathname !== "/") {
          window.location.href = "/";
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
        console.error(
          `Request failed with status ${error.response.status}`,
          error.response.data
        );
    }

    return Promise.reject(error);
  }
);

export default API;