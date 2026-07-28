import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

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
          width: 450,
          padding: 5,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
        >
          Document Approval System
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 4 }}
        >
          Secure Document Workflow
        </Typography>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>

        {/* Registration is restricted to Admins only. Public register button removed. */}
      </Paper>
    </Box>
  );
}

export default Home;