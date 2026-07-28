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
        previewUrl: "",
        approvers: [
            {
                email: "",
                status: "Pending",
                date: "",
                approvedBy: "",
                signature: "",
                detailOrder: ["status", "date", "approvedBy", "signature"],
            },
        ],
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
    updatedDocuments[index].previewUrl = file
      ? file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : ""
      : "";

    setDocuments(updatedDocuments);
  };



  const handleAddFile = () => {
    setDocuments([
      ...documents,
      {
        file: null,
        previewUrl: "",
        approvers: [
          {
            email: "",
            status: "Pending",
            date: "",
            approvedBy: "",
            signature: "",
            detailOrder: ["status", "date", "approvedBy", "signature"],
          },
        ],
      },
    ]);
  };

  const handleRemoveFile = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    if (documents[index]?.previewUrl) {
      URL.revokeObjectURL(documents[index].previewUrl);
    }

    if (updatedDocuments.length === 0) {
      updatedDocuments.push({
        file: null,
        previewUrl: "",
        approvers: [
          {
            email: "",
            status: "Pending",
            date: "",
            approvedBy: "",
            signature: "",
            detailOrder: ["status", "date", "approvedBy", "signature"],
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
    detailOrder: ["status", "date", "approvedBy", "signature"],
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
      detailOrder: ["status", "date", "approvedBy", "signature"],
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

const moveDetail = (documentIndex, approverIndex, detailIndex, direction) => {
  const updatedDocuments = [...documents];
  const approver = updatedDocuments[documentIndex].approvers[approverIndex];
  const newOrder = [...approver.detailOrder];
  const targetIndex = detailIndex + direction;

  if (targetIndex < 0 || targetIndex >= newOrder.length) return;

  const [moved] = newOrder.splice(detailIndex, 1);
  newOrder.splice(targetIndex, 0, moved);
  approver.detailOrder = newOrder;
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
                elevation={3}
                sx={{ p: 3, borderRadius: 3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                        ? `${(document.file.size / 1024).toFixed(2)} KB • ${document.file.type || "Unknown"}`
                        : "Choose a file to attach to this document."}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" component="label">
                      Choose File
                      <input
                        hidden
                        type="file"
                        onChange={(event) => handleFileChange(documentIndex, event)}
                      />
                    </Button>
                    {documents.length > 1 && (
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleRemoveFile(documentIndex)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px dashed #ccc",
                    borderRadius: 2,
                    bgcolor: "#f3f7ff",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        border: "1px solid #dde3f0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <UploadFileIcon sx={{ fontSize: 48, color: "primary.main" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      {document.file ? (
                        <>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap>
                            {document.file.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Size: {(document.file.size / 1024).toFixed(2)} KB
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Type: {document.file.type || "Unknown"}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Select a file to attach it to this document card.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>

                <Stack spacing={2}>
                  {document.approvers.map((approver, approverIndex) => (
                    <Paper
                      key={approverIndex}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #ddd",
                        bgcolor: "#fafafa",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          Approver {approverIndex + 1}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => moveApprover(documentIndex, approverIndex, approverIndex - 1)}
                            disabled={approverIndex === 0}
                          >
                            <ArrowUpwardIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => moveApprover(documentIndex, approverIndex, approverIndex + 1)}
                            disabled={approverIndex === document.approvers.length - 1}
                          >
                            <ArrowDownwardIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeApproverEmail(documentIndex, approverIndex)}
                          >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <TextField
                        label="Approver Email"
                        type="email"
                        fullWidth
                        required
                        placeholder="Enter Admin Email"
                        value={approver.email}
                        onChange={(event) =>
                          handleApproverEmailChange(documentIndex, approverIndex, event.target.value)
                        }
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                          gap: 2,
                          mt: 2,
                        }}
                      >
                        {approver.detailOrder.map((detailKey, detailIndex) => {
                          const detailMap = {
                            status: {
                              title: "Status",
                              value: approver.status,
                              caption: "Approved / Rejected",
                            },
                            date: {
                              title:
                                approver.status === "Approved"
                                  ? "Approved On"
                                  : approver.status === "Rejected"
                                  ? "Rejected On"
                                  : "Status Date",
                              value: approver.date || "-",
                              caption: "Timestamp",
                            },
                            approvedBy: {
                              title:
                                approver.status === "Approved"
                                  ? "Approved By"
                                  : approver.status === "Rejected"
                                  ? "Rejected By"
                                  : "Approver",
                              value: approver.approvedBy || "-",
                              caption: "Admin assigned",
                            },
                            signature: {
                              title: "Signature",
                              value: approver.signature || "-",
                              caption: "Uploaded signature file",
                            },
                          };

                          const detail = detailMap[detailKey];
                          return (
                            <Paper
                              key={detailKey}
                              elevation={0}
                              sx={{
                                p: 2,
                                border: "1px solid #ddd",
                                borderRadius: 2,
                                bgcolor: "#fff",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {detail.title}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                                {detail.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {detail.caption}
                              </Typography>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Paper>
                  ))}

                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => addApproverEmail(documentIndex)}
                  >
                    Add approver
                  </Button>
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
