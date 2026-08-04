import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import API, { API_BASE_URL } from "../../api/api";
import { clearUserSession, getStoredUser } from "../../auth/session";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import {
  LocalizationProvider,
  DateTimePicker,
} from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_APPROVAL_BOX_FIELDS = [
  "Signature",
  "Approved By",
  "Approved On",
  "Status",
];

function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [documents, setDocuments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewDims, setPreviewDims] = useState({ width: 700, height: 900, offsetLeft: 0, offsetTop: 0 });
  const [numPages, setNumPages] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState("");
  const [approvalDateTime, setApprovalDateTime] = useState(dayjs());
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [signatureFilename, setSignatureFilename] = useState("");

  const previewWrapperRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await API.get(`/admin/documents/${user.id}`);
      setDocuments(response.data.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load documents.");
    }
  }, [user.id]);

  useEffect(() => {
    const loadDocuments = async () => {
      await fetchDocuments();
    };

    void loadDocuments();
    // fetch last uploaded signature for this admin (if any)
    const loadSignature = async () => {
      try {
        const res = await API.get(`/admin/signature/${user.id}`);
        if (res.data?.data?.url) {
          setSignaturePreview(res.data.data.url);
          setSignatureFilename(res.data.data.filename || "");
        }
      } catch (err) {
        // ignore; no signature available
      }
    };

    void loadSignature();
  }, [fetchDocuments]);

  const updatePreviewDims = useCallback(() => {
    const wrapper = previewWrapperRef.current;
    const pageElement =
      wrapper?.querySelector(".react-pdf__Page") ||
      wrapper?.querySelector("canvas")?.closest(".react-pdf__Page");
    const sourceElement = pageElement || wrapper;

    if (sourceElement && wrapper) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const rect = sourceElement.getBoundingClientRect();
      setPreviewDims({
        width: rect.width,
        height: rect.height,
        offsetLeft: rect.left - wrapperRect.left,
        offsetTop: rect.top - wrapperRect.top,
      });
    }
  }, []);

  useEffect(() => {
    updatePreviewDims();

    const wrapper = previewWrapperRef.current;
    if (wrapper && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updatePreviewDims);
      observer.observe(wrapper);
      return () => observer.disconnect();
    }
  }, [selectedDocument, updatePreviewDims, openDialog, numPages]);

  const getApprovalBoxScale = (approvalBox) => {
    const previewWidth = previewDims.width || 700;
    const previewHeight = previewDims.height || 900;
    const width = approvalBox.widthRatio != null ? approvalBox.widthRatio * previewWidth : approvalBox.width || 240;
    const height = approvalBox.heightRatio != null ? approvalBox.heightRatio * previewHeight : approvalBox.height || 156;
    return Math.max(0.75, Math.min(1, Math.min(width / 240, height / 156)));

  };

  const handleView = (document) => {
    setSelectedDocument(document);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDocument(null);
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSignatureImage(file);
    setSignaturePreview(URL.createObjectURL(file));
    setSignatureFilename("");
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const handleSubmit = async () => {
    try {
      if (!approvalStatus) {
        alert("Please select approval status.");
        return;
      }

      if (!signatureImage && !signatureFilename) {
        alert("Please upload your signature or use your saved signature.");
        return;
      }

      const formData = new FormData();
      formData.append("documentId", selectedDocument.id);
      formData.append("status", approvalStatus);
      formData.append("approvalDateTime", approvalDateTime.toISOString());
      formData.append("approvedBy", user.email);
      if (signatureImage) {
        formData.append("signature", signatureImage);
      } else if (signatureFilename) {
        formData.append("savedSignatureFilename", signatureFilename);
      }

      const response = await API.post("/admin/document/approve", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(response.data.message);
      handleCloseDialog();
      fetchDocuments();
      // update displayed signature to the newly uploaded file
      try {
        const sigFilename = response.data?.data?.signature;
        if (sigFilename) {
          setSignaturePreview(`${API_BASE_URL}/uploads/signatures/${sigFilename}`);
        }
      } catch (err) {
        // ignore
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to approve document.");
    }
  };

  return (
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
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
            color="inherit"
            variant="outlined"
            sx={{ borderColor: "white", color: "white" }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box p={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Assigned Documents
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Documents assigned to you for approval.
        </Typography>

        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>ID</b>
                  </TableCell>
                  <TableCell>
                    <b>Document</b>
                  </TableCell>
                  <TableCell>
                    <b>Uploaded By</b>
                  </TableCell>
                  <TableCell>
                    <b>Assigned Date</b>
                  </TableCell>
                  <TableCell>
                    <b>Approval Step</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell align="center">
                    <b>View</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Documents Assigned
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.id}</TableCell>
                      <TableCell>{doc.original_file_name}</TableCell>
                      <TableCell>{doc.uploaded_by_email}</TableCell>
                      <TableCell>
                        {new Date(doc.assigned_datetime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Step {doc.approval_order} of {doc.total_approvers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.completed_approvals} completed before this review
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.status}
                          color={
                            doc.status === "Approved"
                              ? "success"
                              : doc.status === "Rejected"
                              ? "error"
                              : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleView(doc)}>
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {selectedDocument?.original_file_name}
          </Typography>

          {selectedDocument && (
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Approval step: {selectedDocument.approval_order} of {selectedDocument.total_approvers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed approvals before this step: {selectedDocument.completed_approvals}
              </Typography>
            </Stack>
          )}

          {selectedDocument && (
            <Box
              ref={previewWrapperRef}
              sx={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "100%" }}
            >
              {(selectedDocument.file_url || selectedDocument.stored_file_name || "").toLowerCase().endsWith(".pdf") ? (
                <Document
                  file={selectedDocument.file_url || `/uploads/${selectedDocument.stored_file_name}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => {
                    console.error("PDF Load Error:", error);
                  }}
                  loading={<Typography>Loading PDF...</Typography>}
                  error={<Typography color="error">Unable to load PDF.</Typography>}
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      onRenderSuccess={updatePreviewDims}
                      width={Math.max(320, Math.min(previewDims.width || 700, 900))}
                    />
                  ))}
                </Document>
              ) : (
                <img
                  src={selectedDocument.file_url || `/uploads/${selectedDocument.stored_file_name}`}
                  alt={selectedDocument.original_file_name}
                  style={{ width: "100%", maxHeight: "650px", objectFit: "contain" }}
                />
              )}

              {Array.isArray(selectedDocument.approval_box_config) &&
                selectedDocument.approval_box_config.length > 0 &&
                selectedDocument.approval_box_config.map((approvalBox, approvalBoxIndex) => {
                  const previewWidth = previewDims.width || 700;
                  const previewHeight = previewDims.height || 900;
                  const left =
                    approvalBox.xRatio != null
                      ? previewDims.offsetLeft + approvalBox.xRatio * previewWidth
                      : approvalBox.x ?? 16;
                  const top =
                    approvalBox.yRatio != null
                      ? previewDims.offsetTop + approvalBox.yRatio * previewHeight
                      : approvalBox.y ?? 16;
                  const width =
                    approvalBox.widthRatio != null
                      ? approvalBox.widthRatio * previewWidth
                      : approvalBox.width ?? 240;
                  const height =
                    approvalBox.heightRatio != null
                      ? approvalBox.heightRatio * previewHeight
                      : approvalBox.height ?? 156;

                  return (
                    <Box
                      key={`${selectedDocument.id}-approval-box-${approvalBoxIndex}`}
                      sx={{
                        position: "absolute",
                        left,
                        top,
                        width,
                        height,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.35,
                        px: 1.4,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: "rgba(255,245,230,0.28)",
                        border: "2px dashed #ffb74d",
                        boxShadow: 1,
                        pointerEvents: "none",
                        overflow: "hidden",
                        fontSize: `${getApprovalBoxScale(approvalBox)}rem`,
                        lineHeight: 1.2,
                        "& .MuiTypography-root": {
                          fontSize: "inherit",
                        },
                      }}
                    >
                      {(approvalBox.fields || DEFAULT_APPROVAL_BOX_FIELDS).map((fieldLabel) => (
                        <Typography key={fieldLabel} variant="body2" sx={{ color: "#424242" }}>
                          {fieldLabel}
                        </Typography>
                      ))}
                    </Box>
                  );
                })}
            </Box>
          )}

          <Box mt={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select value={approvalStatus} label="Status" onChange={(e) => setApprovalStatus(e.target.value)}>
                <MenuItem value="Approved">Approve</MenuItem>
                <MenuItem value="Rejected">Reject</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Approval Date & Time"
                value={approvalDateTime}
                onChange={(newValue) => setApprovalDateTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
              />
            </LocalizationProvider>

            {signaturePreview && (
              <Box mb={2}>
                <Typography fontWeight="bold">Current Signature</Typography>
                <img
                  src={signaturePreview}
                  alt="signature"
                  style={{ width: 220, border: "1px solid #ddd", marginTop: 10, display: "block" }}
                />
              </Box>
            )}

            <Box mt={signaturePreview ? 1 : 3}>
              <Button variant="contained" component="label">
                {signaturePreview ? "Replace Signature" : "Upload Signature"}
                <input hidden type="file" accept="image/*" onChange={handleSignatureUpload} />
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
