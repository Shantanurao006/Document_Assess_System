import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  TextField,
} from "@mui/material";


import { uploadDocuments } from "../../api/uploadApi";
import { validateApprover } from "../../api/approverApi";

function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

const [documents, setDocuments] = useState([
    {
        file: null,
        approverEmail: "",
    },
]);

const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleFileChange = (index, event) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index].file = event.target.files[0];
    setDocuments(updatedDocuments);
  };

  const handleApproverEmailChange = (index, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index].approverEmail = value;
    setDocuments(updatedDocuments);
  };

  const handleAddFile = () => {
    setDocuments([
      ...documents,
      {
        file: null,
        approverEmail: "",
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({
        file: null,
        approverEmail: "",
      });
    }

    setDocuments(updatedDocuments);
  };


const handleSubmit = async () => {

    if (!user || !user.email) {
        alert("Please login again.");
        navigate("/login");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {

        setIsSubmitting(true);

        for (let i = 0; i < documents.length; i++) {

            const document = documents[i];

            if (!document.file) {
                alert(`Please select a file for Document ${i + 1}.`);
                return;
            }

            const approverEmail = document.approverEmail.trim();

            if (!approverEmail) {
                alert(`Please enter approver email for Document ${i + 1}.`);
                return;
            }

            if (!emailRegex.test(approverEmail)) {
                alert(`Please enter a valid email for Document ${i + 1}.`);
                return;
            }

            await validateApprover(approverEmail);
        }

        const response = await uploadDocuments(
    documents,
    user.email
);

alert(response.message);

setDocuments([
    {
        file: null,
        approverEmail: "",
    },
]);

    } catch (error) {

        alert(
            error.response?.data?.message ||
            "Validation failed."
        );

    } finally {

        setIsSubmitting(false);

    }

};


  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Approval System
          </Typography>

          <Typography sx={{ mr: 3 }}>
            {user?.email}
          </Typography>

          <Button
    variant="contained"
    color="secondary"
    sx={{ mr: 2 }}
    onClick={() => navigate("/user/my-documents")}
>
    My Documents
</Button>

<Button
    variant="outlined"
    color="inherit"
    sx={{
        color: "#fff",
        borderColor: "#fff",
    }}
    onClick={handleLogout}
>
    Logout
</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          User Dashboard
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Upload one or more documents for approval.
        </Typography>

        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Upload Documents
          </Typography>

          <Stack spacing={3}>
            {documents.map((document, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                        variant="outlined"
                        component="label"
                        sx={{ minWidth: 140 }}
                    >
                      Choose File

                      <input
                        hidden
                        type="file"
                        onChange={(e) =>
                          handleFileChange(index, e)
                        }
                      />
                    </Button>

                    <Typography
                      sx={{
                          flexGrow: 1,
                          wordBreak: "break-word",
                      }}
                  >
                      {document.file
                          ? document.file.name
                          : "No file selected"}
                  </Typography>
                  </Box>

                  <TextField
                    label="Approver Email"
                    type="email"
                    fullWidth
                    required
                    placeholder="Enter Admin Email"
                    value={document.approverEmail}
                    onChange={(e) =>
                      handleApproverEmailChange(
                        index,
                        e.target.value
                      )
                    }
                  />

                  {documents.length > 1 && (
                    <Box>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() =>
                          handleRemoveFile(index)
                        }
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ))}

            <Box>
              <Button
                variant="contained"
                onClick={handleAddFile}
              >
                + Add More Files
              </Button>
            </Box>

            <Box>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Uploading..." : "Submit"}
            </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

export default UserDashboard;