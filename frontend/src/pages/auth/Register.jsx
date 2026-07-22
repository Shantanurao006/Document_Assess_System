import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    pin: "",
    confirmPin: "",
    isAdmin: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async () => {
    if (!formData.email.trim()) {
      alert("Please enter Email.");
      return;
    }

    if (formData.pin.length !== 4) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    if (formData.confirmPin.length !== 4) {
      alert("Confirm PIN must be exactly 4 digits.");
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      alert("PIN and Confirm PIN do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          email: formData.email,
          pin: formData.pin,
          isAdmin: formData.isAdmin,
        }
      );

      alert(response.data.message);

      setFormData({
        email: "",
        pin: "",
        confirmPin: "",
        isAdmin: false,
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to register user."
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        elevation={5}
        sx={{
          width: 420,
          padding: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          fontWeight="bold"
          gutterBottom
        >
          Register
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="User Name"
          placeholder="example@example.com"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="PIN (4 Digit)"
          type="password"
          placeholder="••••"
          name="pin"
          value={formData.pin}
          onChange={handleChange}
          inputProps={{
            maxLength: 4,
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Re-Enter PIN"
          type="password"
          placeholder="••••"
          name="confirmPin"
          value={formData.confirmPin}
          onChange={handleChange}
          inputProps={{
            maxLength: 4,
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
            />
          }
          label="Admin"
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 2 }}
          onClick={handleRegister}
        >
          Register
        </Button>
      </Paper>
    </Box>
  );
}

export default Register;