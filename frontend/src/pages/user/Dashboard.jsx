import { useState, useEffect, useRef } from "react";
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
                x: 20,
                y: 20,
                detailOrder: ["status", "date", "approvedBy", "signature"],
            },
        ],
    },
]);

const [isSubmitting, setIsSubmitting] = useState(false);
const [dragging, setDragging] = useState(null);
const previewRefs = useRef([]);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateApproverPosition = (documentIndex, approverIndex, x, y) => {
  setDocuments((prev) => {
    const next = [...prev];
    if (!next[documentIndex] || !next[documentIndex].approvers[approverIndex]) {
      return prev;
    }
    next[documentIndex] = { ...next[documentIndex] };
    next[documentIndex].approvers = [...next[documentIndex].approvers];
    next[documentIndex].approvers[approverIndex] = {
      ...next[documentIndex].approvers[approverIndex],
      x,
      y,
    };
    return next;
  });
};

const handleDragStart = (documentIndex, approverIndex, event) => {
  event.preventDefault();
  const targetRect = event.currentTarget.getBoundingClientRect();
  setDragging({
    documentIndex,
    approverIndex,
    offsetX: event.clientX - targetRect.left,
    offsetY: event.clientY - targetRect.top,
  });
};

const stopDrag = () => {
  setDragging(null);
};

useEffect(() => {
  const handlePointerMove = (event) => {
    if (!dragging) return;
    const previewEl = previewRefs.current[dragging.documentIndex];
    if (!previewEl) return;

    const previewRect = previewEl.getBoundingClientRect();
    const x = clamp(event.clientX - previewRect.left - dragging.offsetX, 0, previewRect.width - 220);
    const y = clamp(event.clientY - previewRect.top - dragging.offsetY, 0, previewRect.height - 140);
    updateApproverPosition(dragging.documentIndex, dragging.approverIndex, x, y);
  };

  if (dragging) {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  }

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDrag);
  };
}, [dragging]);

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
            x: 20,
            y: 20,
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
            x: 20,
            y: 20,
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
    x: 20,
    y: 20,
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

                <Box
                  sx={{
                    position: "relative",
                    minHeight: 360,
                    border: "1px solid #c5d2e8",
                    borderRadius: 3,
                    bgcolor: "#eef4ff",
                    p: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: 3,
                      bgcolor: "#fff",
                      overflow: "hidden",
                    }}
                    ref={(el) => {
                      previewRefs.current[documentIndex] = el;
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 2,
                        p: 3,
                        zIndex: 1,
                      }}
                    >
                      {document.previewUrl ? (
                        <img
                          src={document.previewUrl}
                          alt={document.file?.name || "Document preview"}
                          style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            width: "100%",
                            height: "100%",
                            color: "text.secondary",
                          }}
                        >
                          <UploadFileIcon sx={{ fontSize: 64, color: "primary.main" }} />
                          <Typography variant="h6" fontWeight="bold" textAlign="center">
                            {document.file ? document.file.name : "Document preview"}
                          </Typography>
                          <Typography variant="body2" textAlign="center">
                            {document.file
                              ? `Uploaded file preview is unavailable for this format.`
                              : "Choose a file to display it here."}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {document.approvers.map((approver, approverIndex) => (
                      <Paper
                        key={approverIndex}
                        elevation={6}
                        onPointerDown={(event) => handleDragStart(documentIndex, approverIndex, event)}
                        sx={{
                          position: "absolute",
                          left: `${approver.x}px`,
                          top: `${approver.y}px`,
                          width: 220,
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid rgba(0,0,0,0.12)",
                          bgcolor: "rgba(255,255,255,0.95)",
                          cursor: "grab",
                          userSelect: "none",
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            Signer {approverIndex + 1}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
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
                          </Box>
                        </Box>

                        <TextField
                          label="Signer Email"
                          type="email"
                          fullWidth
                          required
                          placeholder="Enter Admin Email"
                          value={approver.email}
                          onChange={(event) =>
                            handleApproverEmailChange(documentIndex, approverIndex, event.target.value)
                          }
                          size="small"
                        />

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 100 }}>
                            <Typography variant="caption" color="text.secondary">
                              Status
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {approver.status}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 100 }}>
                            <Typography variant="caption" color="text.secondary">
                              Date
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {approver.date || "-"}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => addApproverEmail(documentIndex)}
                  >
                    Add signer
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
