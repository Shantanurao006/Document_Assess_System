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

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { uploadDocuments } from "../../api/uploadApi";
import { validateApprover } from "../../api/approverApi";
import { clearUserSession, getStoredUser } from "../../auth/session";

function UserDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [documents, setDocuments] = useState([
    {
      file: null,
      previewUrl: "",
      approvers: [{ email: "" }],
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const handleFileChange = (index, event) => {
    const file = event.target.files[0];
    const updatedDocuments = [...documents];

    if (updatedDocuments[index].previewUrl) {
      URL.revokeObjectURL(updatedDocuments[index].previewUrl);
    }

    updatedDocuments[index].file = file;
    updatedDocuments[index].previewUrl = file ? URL.createObjectURL(file) : "";

    setDocuments(updatedDocuments);
  };

  const handleAddFile = () => {
    setDocuments([
      ...documents,
      {
        file: null,
        previewUrl: "",
        approvers: [{ email: "" }],
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (documents[index]?.previewUrl) {
      URL.revokeObjectURL(documents[index].previewUrl);
    }

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({ file: null, previewUrl: "", approvers: [{ email: "" }] });
    }

    setDocuments(updatedDocuments);
  };

  const handleApproverEmailChange = (documentIndex, approverIndex, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers[approverIndex].email = value;
    setDocuments(updatedDocuments);
  };

  const addApproverEmail = (documentIndex) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers.push({ email: "" });
    setDocuments(updatedDocuments);
  };

  const removeApproverEmail = (documentIndex, approverIndex) => {
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex].approvers.splice(approverIndex, 1);

    if (updatedDocuments[documentIndex].approvers.length === 0) {
      updatedDocuments[documentIndex].approvers.push({ email: "" });
    }

    setDocuments(updatedDocuments);
  };

  const canSubmit =
    documents.some((doc) => doc.file) &&
    documents.some((doc) => doc.approvers.some((app) => app.email.trim()));

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

        const emails = document.approvers.map((approver) => approver.email.trim()).filter(Boolean);

        if (emails.length === 0) {
          alert(`Please enter at least one approver email for Document ${i + 1}.`);
          return;
        }

        for (const email of emails) {
          if (!emailRegex.test(email)) {
            alert(`Please enter a valid email: ${email}`);
            return;
          }

          await validateApprover(email);
        }
      }

      const response = await uploadDocuments(documents, user.email);
      alert(response.message);

      setDocuments([{ file: null, previewUrl: "", approvers: [{ email: "" }] }]);
    } catch (error) {
      alert(error.response?.data?.message || "Validation failed.");
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
          {user?.role === "ADMIN" && (
            <Button
              variant="outlined"
              color="inherit"
              sx={{ mr: 2, color: "#fff", borderColor: "#fff" }}
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          )}
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
              <Paper key={documentIndex} elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {document.file ? document.file.name : `Document ${documentIndex + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {document.file
                        ? `${(document.file.size / 1024).toFixed(2)} KB - ${document.file.type || "Unknown"}`
                        : "Choose a file to attach to this document."}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" component="label">
                      Choose File
                      <input
                        hidden
                        id={`document-file-${documentIndex}`}
                        name={`documentFile_${documentIndex}`}
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(event) => handleFileChange(documentIndex, event)}
                      />
                    </Button>
                    {documents.length > 1 && (
                      <Button color="error" variant="contained" onClick={() => handleRemoveFile(documentIndex)}>
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  {document.previewUrl ? (
                    document.file?.type.startsWith("image/") ? (
                      <img
                        src={document.previewUrl}
                        alt={document.file?.name || "Document preview"}
                        style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 12 }}
                      />
                    ) : (
                      <iframe
                        title={document.file?.name || "Document preview"}
                        src={document.previewUrl}
                        style={{ width: "100%", height: 360, border: "none", borderRadius: 12 }}
                      />
                    )
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        minHeight: 220,
                        color: "text.secondary",
                        border: "1px dashed #c5d2e8",
                        borderRadius: 3,
                        p: 4,
                      }}
                    >
                      <UploadFileIcon sx={{ fontSize: 48, color: "primary.main" }} />
                      <Typography variant="body1" fontWeight="bold">
                        Document preview will appear here.
                      </Typography>
                      <Typography variant="body2" textAlign="center">
                        Upload a PDF or image to preview the document.
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Approver Emails
                </Typography>

                <Stack spacing={2}>
                  {document.approvers.map((approver, approverIndex) => (
                    <Box
                      key={approverIndex}
                      sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}
                    >
                      <TextField
                        id={`approver-email-${documentIndex}-${approverIndex}`}
                        name={`approverEmail_${documentIndex}_${approverIndex}`}
                        label={`Email ${approverIndex + 1}`}
                        type="email"
                        autoComplete="email"
                        fullWidth
                        required
                        placeholder="Enter approver email"
                        value={approver.email}
                        onChange={(event) =>
                          handleApproverEmailChange(documentIndex, approverIndex, event.target.value)
                        }
                        size="small"
                      />
                      {document.approvers.length > 1 && (
                        <Button
                          variant="text"
                          color="error"
                          startIcon={<RemoveCircleOutlineIcon />}
                          onClick={() => removeApproverEmail(documentIndex, approverIndex)}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Button startIcon={<AddCircleOutlineIcon />} onClick={() => addApproverEmail(documentIndex)}>
                    Add approver email
                  </Button>
                </Box>
              </Paper>
            ))}

            <Box>
              <Button variant="contained" onClick={handleAddFile}>
                + Add More Files
              </Button>
            </Box>

            <Box>
              <Button variant="contained" color="success" size="large" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
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
