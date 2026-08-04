import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Landing page removed; redirect root to /login so only one login page exists
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import UserDashboard from "../pages/user/Dashboard";
import MyDocuments from "../pages/user/MyDocuments";
import AdminDashboard from "../pages/admin/Dashboard";
import ProtectedRoute from "../auth/ProtectedRoute";
import SessionTimeout from "../auth/SessionTimeout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>

        {/* Root -> Login (single login page) */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboards */}
        <Route
    path="/user/dashboard"
    element={
      <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
        <UserDashboard />
      </ProtectedRoute>
    }
/>

<Route
    path="/user/my-documents"
    element={
      <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
        <MyDocuments />
      </ProtectedRoute>
    }
/>

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Invalid Route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
