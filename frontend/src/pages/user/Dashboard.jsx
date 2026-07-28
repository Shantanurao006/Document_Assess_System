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
  IconButton,
} from "@mui/material";


import { uploadDocuments } from "../../api/uploadApi";
import { validateApprover } from "../../api/approverApi";
import { clearUserSession, getStoredUser } from "../../auth/session";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";

function UserDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

const [documents, setDocuments] = useState([
    {
        file: null,
        approvers: [
            {
                email: "",
                status: "Pending",
                date: "",
                approvedBy: "",
                signature: "",
            },
        ],
    },
]);

const [draggedApprover, setDraggedApprover] = useState(null);
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
        approvers: [
          {
            email: "",
            status: "Pending",
            date: "",
            approvedBy: "",
            signature: "",
          },
        ],
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({
        file: null,
        approvers: [
          {
            email: "",
            status: "Pending",
            date: "",
            approvedBy: "",
            signature: "",
          },
        ],
      });
    }

    setDocuments(updatedDocuments);
  };


  const handleApproverEmailChange = (
  documentIndex,
  approverIndex,
  value
) => {
  const updatedDocuments = [...documents];
  updatedDocuments[documentIndex].approvers[approverIndex].email = value;
  setDocuments(updatedDocuments);
};

const addApproverEmail = (documentIndex) => {
  const updatedDocuments = [...documents];

  updatedDocuments[documentIndex].approvers.push({
    email: "",
    status: "Pending",
    date: "",
    approvedBy: "",
    signature: "",
  });

  setDocuments(updatedDocuments);
};

const removeApproverEmail = (documentIndex, approverIndex) => {
  const updatedDocuments = [...documents];

  updatedDocuments[documentIndex].approvers.splice(approverIndex, 1);

  if (updatedDocuments[documentIndex].approvers.length === 0) {
    updatedDocuments[documentIndex].approvers.push({
      email: "",
      status: "Pending",
      date: "",
      approvedBy: "",
      signature: "",
    });
  }

  setDocuments(updatedDocuments);
};

const moveApprover = (documentIndex, fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= documents[documentIndex].approvers.length) {
    return;
  }

  const updatedDocuments = [...documents];
  const approvers = [...updatedDocuments[documentIndex].approvers];
  const [moved] = approvers.splice(fromIndex, 1);
  approvers.splice(toIndex, 0, moved);
  updatedDocuments[documentIndex].approvers = approvers;
  setDocuments(updatedDocuments);
};

const handleDragStart = (documentIndex, approverIndex) => {
  setDraggedApprover({ documentIndex, approverIndex });
};

const handleDrop = (documentIndex, targetIndex) => {
  if (!draggedApprover) return;

  const { documentIndex: fromDoc, approverIndex: fromIndex } = draggedApprover;
  if (fromDoc !== documentIndex) return;

  moveApprover(documentIndex, fromIndex, targetIndex);
  setDraggedApprover(null);
};

const handleDragOver = (event) => {
  event.preventDefault();
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

            for (const approver of document.approvers) {
                const email = approver.email.trim();

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
                approvers: [
                    {
                        email: "",
                        status: "Pending",
                        date: "",
                        approvedBy: "",
                        signature: "",
                    },
                ],
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

                  {document.approvers.map((approver, approverIndex) => (
                    <Paper
                      key={approverIndex}
                      elevation={1}
                      sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        backgroundColor: "#fafafa",
                      }}
                      draggable
                      onDragStart={() => handleDragStart(documentIndex, approverIndex)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(documentIndex, approverIndex)}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: "text.secondary" }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Approver {approverIndex + 1}
                        </Typography>
                      </Box>

                      <TextField
                        label="Approver Email"
                        type="email"
                        fullWidth
                        required
                        placeholder="Enter Admin Email"
                        value={approver.email}
                        onChange={(event) =>
                          handleApproverEmailChange(
                            documentIndex,
                            approverIndex,
                            event.target.value
                          )
                        }
                      />

                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#fff",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {approver.status}
                          </Typography>
                        </Paper>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#fff",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {approver.status === "Approved" ? "Approved On" : approver.status === "Rejected" ? "Rejected On" : "Status Date"}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {approver.date || "-"}
                          </Typography>
                        </Paper>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#fff",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {approver.status === "Approved" ? "Approved By" : approver.status === "Rejected" ? "Rejected By" : "Approver"}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {approver.approvedBy || "-"}
                          </Typography>
                        </Paper>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#fff",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Signature
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {approver.signature || "-"}
                          </Typography>
                        </Paper>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton
                          aria-label="Move up"
                          size="small"
                          onClick={() => moveApprover(documentIndex, approverIndex, approverIndex - 1)}
                        >
                          <ArrowUpwardIcon />
                        </IconButton>
                        <IconButton
                          aria-label="Move down"
                          size="small"
                          onClick={() => moveApprover(documentIndex, approverIndex, approverIndex + 1)}
                        >
                          <ArrowDownwardIcon />
                        </IconButton>
                        <IconButton
                          aria-label="Remove approver"
                          color="error"
                          onClick={() => removeApproverEmail(documentIndex, approverIndex)}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </Box>
                    </Paper>
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
