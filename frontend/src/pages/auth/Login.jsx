import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

function Login() {
  const navigate = useNavigate();

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
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email,
          pin: formData.pin,
        }
      );

      const user = response.data.data;

      localStorage.setItem("user", JSON.stringify(user));

      alert(`Welcome ${user.email}`);

      if (user.role === "ADMIN") {
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
      sx={{
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={5}
        sx={{
          width: 420,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          fontWeight="bold"
          mb={4}
        >
          Login
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          placeholder="example@gmail.com"
          value={formData.email}
          onChange={handleChange}
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
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Paper>
    </Box>
  );
}

export default Login;