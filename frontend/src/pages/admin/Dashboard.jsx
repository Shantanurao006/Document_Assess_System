import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import API, { API_BASE_URL } from "../../api/api";
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
  TextField,
} from "@mui/material";

import {
  LocalizationProvider,
  DateTimePicker,
} from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [documents, setDocuments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
const [selectedDocument, setSelectedDocument] = useState(null);

const [numPages, setNumPages] = useState(0);

const fetchDocuments = useCallback(async () => {
  try {
    const response = await API.get(
  `/admin/documents/${user.id}`
);

    setDocuments(response.data.data);
  } catch (error) {
    console.error(error);
    alert("Failed to load documents.");
  }
}, [user.id]);

useEffect(() => {
  fetchDocuments();
}, [fetchDocuments]);


 const handleView = (document) => {

  console.log(document);

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
};

const onDocumentLoadSuccess = ({ numPages }) => {
  setNumPages(numPages);
};

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSubmit = async () => {
  try {
    if (!approvalStatus) {
      alert("Please select approval status.");
      return;
    }

    if (!signatureImage) {
      alert("Please upload your signature.");
      return;
    }

    const formData = new FormData();

    formData.append("documentId", selectedDocument.id);
    formData.append("status", approvalStatus);
    formData.append("approvalDateTime", approvalDateTime.toISOString());
    formData.append("signature", signatureImage);

    const response = await API.post(
  "/admin/document/approve",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);
    alert(response.data.message);

    handleCloseDialog();

    fetchDocuments();
  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
      "Failed to approve document."
    );
  }
};


  const [approvalStatus, setApprovalStatus] = useState("");

const [approvalDateTime, setApprovalDateTime] = useState(dayjs());

const [signatureImage, setSignatureImage] = useState(null);

const [signaturePreview, setSignaturePreview] = useState("");

  return (
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Approval System
          </Typography>

          <Typography sx={{ mr: 3 }}>
            {user?.email}
          </Typography>

          <Button
            color="inherit"
            variant="outlined"
            sx={{
              borderColor: "white",
              color: "white",
            }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Box p={4}>
  <Typography
    variant="h4"
    fontWeight="bold"
    gutterBottom
  >
    Assigned Documents
  </Typography>

  <Typography
    color="text.secondary"
    mb={3}
  >
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
              <TableCell
                colSpan={5}
                align="center"
              >
                No Documents Assigned
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.id}</TableCell>

                <TableCell>
                  {doc.original_file_name}
                </TableCell>

                <TableCell>
                  {doc.uploaded_by_email}
                </TableCell>

                <TableCell>
                  {new Date(
                    doc.assigned_datetime
                  ).toLocaleString()}
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
                  <IconButton
                    color="primary"
                    onClick={() => handleView(doc)}
                  >
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

<Dialog
  open={openDialog}
  onClose={handleCloseDialog}
  fullWidth
  maxWidth="md"
>
  <DialogTitle>
    Document Details
  </DialogTitle>

<DialogContent>

  <Typography
    variant="h6"
    gutterBottom
  >
    {selectedDocument?.original_file_name}
  </Typography>

  {selectedDocument && (
    selectedDocument.stored_file_name
      .toLowerCase()
      .endsWith(".pdf") ? (

 <Document
  file={`${API_BASE_URL}/uploads/${selectedDocument.stored_file_name}`}
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
      width={700}
    />
  ))}
</Document>

    ) : (

      <img
        src={`${API_BASE_URL}/uploads/${selectedDocument.stored_file_name}`}
        alt={selectedDocument.original_file_name}
        style={{
          width: "100%",
          maxHeight: "650px",
          objectFit: "contain",
        }}
      />

    )
  )}

<Box mt={4}>

  <FormControl fullWidth margin="normal">
    <InputLabel>Status</InputLabel>

    <Select
      value={approvalStatus}
      label="Status"
      onChange={(e) => setApprovalStatus(e.target.value)}
    >
      <MenuItem value="Approved">
        Approve
      </MenuItem>

      <MenuItem value="Rejected">
        Reject
      </MenuItem>
    </Select>
  </FormControl>

  <LocalizationProvider
    dateAdapter={AdapterDayjs}
  >
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

  <Box mt={3}>

    <Button
      variant="contained"
      component="label"
    >
      Upload Signature

      <input
        hidden
        type="file"
        accept="image/*"
        onChange={handleSignatureUpload}
      />
    </Button>

  </Box>

  {signaturePreview && (

    <Box mt={2}>

      <Typography fontWeight="bold">
        Signature Preview
      </Typography>

      <img
        src={signaturePreview}
        alt="signature"
        style={{
          width: 220,
          border: "1px solid #ddd",
          marginTop: 10,
        }}
      />

    </Box>

  )}

</Box>

</DialogContent>



<DialogActions>

  <Button
    onClick={handleCloseDialog}
  >
    Cancel
  </Button>

 <Button
  variant="contained"
  color="success"
  onClick={handleSubmit}
>
  Submit
</Button>

</DialogActions>
</Dialog>

    </Box>

  );
}

export default AdminDashboard;