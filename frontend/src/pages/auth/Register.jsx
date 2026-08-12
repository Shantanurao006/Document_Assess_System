import { useState } from "react";
import API from "../../api/api";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const getPasswordFieldSlots = (isVisible, toggleVisibility) => ({
  input: {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          edge="end"
          onClick={toggleVisibility}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  },
});

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    pin: "",
    confirmPin: "",
    isAdmin: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (formData.pin.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (formData.confirmPin.length < 8) {
      alert("Confirm Password must be at least 8 characters.");
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      alert("Password and Confirm Password do not match.");
      return;
    }

    try {
      const response = await API.post("/auth/register", {
  email: formData.email,
  pin: formData.pin,
  isAdmin: formData.isAdmin,
});

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
          label="Email"
          placeholder="example@gmail.com"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
        />

        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter a secure password"
          name="pin"
          value={formData.pin}
          onChange={handleChange}
          inputProps={{
            maxLength: 64,
          }}
          autoComplete="new-password"
          slotProps={getPasswordFieldSlots(
            showPassword,
            () => setShowPassword((prev) => !prev)
          )}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter password"
          name="confirmPin"
          value={formData.confirmPin}
          onChange={handleChange}
          inputProps={{
            maxLength: 64,
          }}
          autoComplete="new-password"
          slotProps={getPasswordFieldSlots(
            showConfirmPassword,
            () => setShowConfirmPassword((prev) => !prev)
          )}
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
