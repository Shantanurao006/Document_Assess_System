import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { saveUserSession } from "../../auth/session";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

function Login() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const nextPath = searchParams.get("next");

  const [formData, setFormData] = useState({
    email: "",
    pin: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    if (!formData.email.trim()) {
      alert("Please enter Email");
      return;
    }

    if (!formData.pin.trim()) {
      alert("Please enter PIN");
      return;
    }

    if (formData.pin.length !== 4) {
      alert("PIN must be exactly 4 digits");
      return;
    }

    try {
      const response = await API.post("/auth/login", {
  email: formData.email,
  pin: formData.pin,
});

      const user = response.data.data;

      saveUserSession(user);

      alert(`Welcome ${user.email}`);

      if (nextPath && nextPath.startsWith("/") && nextPath !== "/login") {
        navigate(nextPath);
      } else if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login Failed"
      );

      setFormData((prev) => ({
        ...prev,
        pin: "",
      }));
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      width="100%"
      position="relative"
      sx={{
        backgroundColor: "#ffffff",
        p: 2,
      }}
    >
      <Box
        position="absolute"
        inset={0}
        sx={{
          background: 'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 25%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 20%)',
          opacity: 1,
          zIndex: 0,
        }}
      />

      <Paper
        elevation={8}
        sx={{
          position: "relative",
          zIndex: 1,
          width: { xs: "100%", sm: 460 },
          maxWidth: 520,
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.12)",
          backgroundColor: "#ffffff",
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          fontWeight="700"
          mb={1}
        >
          Login
        </Typography>
        <Typography
          variant="body2"
          textAlign="center"
          color="text.secondary"
          mb={4}
        >
          Secure access to the document approval system.
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          type="email"
          placeholder="example@gmail.com"
          value={formData.email}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="PIN"
          name="pin"
          type="password"
          placeholder="••••"
          value={formData.pin}
          onChange={handleChange}
          inputProps={{
            maxLength: 4,
            inputMode: "numeric",
          }}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3, py: 1.6, fontWeight: 600 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Paper>
    </Box>
  );
}

export default Login;
