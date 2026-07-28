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
import { clearUserSession, getStoredUser } from "../../auth/session";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import IconButton from "@mui/material/IconButton";

function UserDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

const [documents, setDocuments] = useState([
    {
        file: null,
        approverEmails: [""],
    },
]);

const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const handleFileChange = (index, event) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index].file = event.target.files[0];
    setDocuments(updatedDocuments);
  };



  const handleAddFile = () => {
    setDocuments([
      ...documents,
      {
        file: null,
        approverEmails: [""],
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({
        file: null,
        approverEmails: [""],
      });
    }

    setDocuments(updatedDocuments);
  };


  const handleApproverEmailChange = (
  documentIndex,
  emailIndex,
  value
) => {
  const updatedDocuments = [...documents];
  updatedDocuments[documentIndex].approverEmails[emailIndex] = value;
  setDocuments(updatedDocuments);
};

const addApproverEmail = (documentIndex) => {
  const updatedDocuments = [...documents];

  updatedDocuments[documentIndex].approverEmails.push("");

  setDocuments(updatedDocuments);
};

const removeApproverEmail = (documentIndex, emailIndex) => {
  const updatedDocuments = [...documents];

  updatedDocuments[documentIndex].approverEmails.splice(emailIndex, 1);

  if (updatedDocuments[documentIndex].approverEmails.length === 0) {
    updatedDocuments[documentIndex].approverEmails.push("");
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

            for (const approverEmail of document.approverEmails) {
                const email = approverEmail.trim();

                if (!email) {
                    alert(`Please enter approver email for Document ${i + 1}.`);
                    return;
                }

                if (!emailRegex.test(email)) {
                    alert(`Please enter a valid email: ${email}`);
                    return;
                }

                await validateApprover(email);
            }
        }

        const response = await uploadDocuments(
            documents,
            user.email
        );

        alert(response.message);

        setDocuments([
            {
                file: null,
                approverEmails: [""],
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
          <Typography sx={{ mr: 3 }}>{user?.email}</Typography>
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
            sx={{ color: "#fff", borderColor: "#fff" }}
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

        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Upload Documents
          </Typography>

          <Stack spacing={3}>
            {documents.map((document, documentIndex) => (
              <Paper
                key={documentIndex}
                elevation={2}
                sx={{ p: 3, borderRadius: 2 }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Button variant="outlined" component="label" sx={{ minWidth: 140 }}>
                      Choose File
                      <input
                        hidden
                        type="file"
                        onChange={(event) => handleFileChange(documentIndex, event)}
                      />
                    </Button>
                    <Typography sx={{ flexGrow: 1, wordBreak: "break-word" }}>
                      {document.file ? document.file.name : "No file selected"}
                    </Typography>
                  </Box>

                  {document.approverEmails.map((email, emailIndex) => (
                    <Box key={emailIndex} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TextField
                        label={`Approver Email ${emailIndex + 1}`}
                        type="email"
                        fullWidth
                        required
                        placeholder="Enter Admin Email"
                        value={email}
                        onChange={(event) =>
                          handleApproverEmailChange(
                            documentIndex,
                            emailIndex,
                            event.target.value
                          )
                        }
                      />
                      <IconButton
                        aria-label="Remove approver"
                        color="error"
                        onClick={() => removeApproverEmail(documentIndex, emailIndex)}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Box>
                  ))}

                  <Box>
                    <Button
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => addApproverEmail(documentIndex)}
                    >
                      Add approver
                    </Button>
                  </Box>

                  {documents.length > 1 && (
                    <Box>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleRemoveFile(documentIndex)}
                      >
                        Remove document
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ))}

            <Box>
              <Button variant="contained" onClick={handleAddFile}>
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
