import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { saveUserSession } from "../../auth/session";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Fade,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
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

function Login() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const nextPath = searchParams.get("next");

  const [formData, setFormData] = useState({
    email: "",
    pin: "",
  });
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changeData, setChangeData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeData = (e) => {
    const { name, value } = e.target;

    setChangeData((prev) => ({
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
      alert("Please enter Password");
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

  const handleChangePassword = async () => {
    if (!formData.email.trim()) {
      alert("Please enter Email");
      return;
    }

    if (!changeData.currentPassword.trim()) {
      alert("Please enter current password");
      return;
    }

    if (!changeData.newPassword.trim()) {
      alert("Please enter new password");
      return;
    }

    if (changeData.newPassword.length < 8) {
      alert("New password must be at least 8 characters");
      return;
    }

    if (changeData.newPassword !== changeData.confirmNewPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      await API.post("/auth/change-password", {
        email: formData.email,
        currentPassword: changeData.currentPassword,
        newPassword: changeData.newPassword,
      });

      alert("Password changed successfully. Please login with your new password.");
      setOpenChangePassword(false);
      setChangeData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setFormData((prev) => ({
        ...prev,
        pin: "",
      }));
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Password change failed"
      );
    }
  };

  return (
    <Box
sx={{
display:"flex",
justifyContent:"center",
alignItems:"center",
minHeight:"100vh",
width:"100%",
overflow:"auto",
px:2,
py:4,
background:
"linear-gradient(135deg,#eff6ff 0%,#dbeafe 40%,#ffffff 100%)",
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
elevation={10}
sx={{
width:{
xs:"100%",
sm:430,
md:460
},
maxWidth:460,
borderRadius:5,
p:{
xs:3,
sm:5
},
boxShadow:"0 20px 60px rgba(0,0,0,.12)"
}}
>
        <Typography
variant="h4"
fontWeight={700}
textAlign="center"
>

Welcome Back

</Typography>

<Typography
textAlign="center"
color="text.secondary"
mb={4}
>

Sign in to continue

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
          label="Password"
          name="pin"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={formData.pin}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          autoComplete="current-password"
          slotProps={getPasswordFieldSlots(
            showPassword,
            () => setShowPassword((prev) => !prev)
          )}
        />

        <Button
  variant="contained"
  fullWidth
  onClick={handleLogin}
  sx={{
    mt:3,
    height:52,
    fontWeight:700,
    borderRadius:3,
    textTransform:"none"
  }}
>
  Login
</Button>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
          <Typography variant="body2">Need to change password?</Typography>
          <Button
variant="text"
startIcon={<LockResetIcon />}
onClick={() => setOpenChangePassword(true)}
>
Change Password
</Button>
        </Box>

        
      </Paper>
      <Dialog
open={openChangePassword}
onClose={() => setOpenChangePassword(false)}
maxWidth="xs"
fullWidth
TransitionComponent={Fade}
PaperProps={{
sx:{
borderRadius:4
}
}}
>

<DialogTitle>

<Box
display="flex"
justifyContent="space-between"
alignItems="center"
>

<Typography
fontWeight={700}
fontSize={22}
>

Change Password

</Typography>

<IconButton
onClick={() =>
setOpenChangePassword(false)
}
>

<CloseIcon/>

</IconButton>

</Box>

</DialogTitle>

<Divider/>

<DialogContent>

<TextField
fullWidth
margin="normal"
label="Current Password"
name="currentPassword"
type={
showCurrentPassword
? "text"
: "password"
}
value={changeData.currentPassword}
onChange={handleChangeData}
slotProps={getPasswordFieldSlots(
showCurrentPassword,
()=>setShowCurrentPassword(prev=>!prev)
)}
/>

<TextField
fullWidth
margin="normal"
label="New Password"
name="newPassword"
type={
showNewPassword
? "text"
: "password"
}
value={changeData.newPassword}
onChange={handleChangeData}
slotProps={getPasswordFieldSlots(
showNewPassword,
()=>setShowNewPassword(prev=>!prev)
)}
/>

<TextField
fullWidth
margin="normal"
label="Confirm Password"
name="confirmNewPassword"
type={
showConfirmNewPassword
? "text"
: "password"
}
value={changeData.confirmNewPassword}
onChange={handleChangeData}
slotProps={getPasswordFieldSlots(
showConfirmNewPassword,
()=>setShowConfirmNewPassword(prev=>!prev)
)}
/>

</DialogContent>

<DialogActions
sx={{
p:3
}}
>

<Button
onClick={() =>
setOpenChangePassword(false)
}
>

Cancel

</Button>

<Button
variant="contained"
onClick={handleChangePassword}
>

Update Password

</Button>

</DialogActions>

</Dialog>
    </Box>
  );
}

export default Login;
