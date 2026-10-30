import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { clearUserSession, getStoredUser } from "../../auth/session";
import API from "../../api/api";
import DownloadIcon from "@mui/icons-material/Download";

function UploadedDocuments() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [statusTab, setStatusTab] = useState("Pending");
  const [searchText, setSearchText] = useState("");

  const fetchUploadedDocuments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await API.get(`/admin/uploaded-documents/${user.id}`);
      setDocuments(response.data?.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load your uploaded documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchUploadedDocuments();
  }, [fetchUploadedDocuments]);

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const handleDownload = async (document) => {
    try {
      const response = await API.get(
        `/document/download/${document.download_assignment_id}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(response.data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.signed_pdf_name || document.original_file_name;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Unable to download the completed document.");
    }
  };

  const filteredDocuments = documents
    .filter((document) => document.status === statusTab)
    .filter((document) => {
      const query = searchText.trim().toLowerCase();
      if (!query) return true;

      return [document.id, document.original_file_name, document.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Approval System
          </Typography>
          <Typography sx={{ mr: 3 }}>{user?.email}</Typography>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ mr: 2, color: "#fff", borderColor: "#fff" }}
            onClick={() => navigate("/admin/dashboard")}
          >
            My Approvals
          </Button>
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
          My Uploaded Documents
        </Typography>
        <Typography color="text.secondary">
          Track the approval progress of documents you uploaded.
        </Typography>

        <Paper elevation={3} sx={{ mt: 3, p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Tabs
              value={statusTab}
              onChange={(_, nextValue) => setStatusTab(nextValue)}
            >
              <Tab label="Pending" value="Pending" />
              <Tab label="Approved" value="Approved" />
              <Tab label="Rejected" value="Rejected" />
            </Tabs>
            <Button
              variant="outlined"
              onClick={() => void fetchUploadedDocuments()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
          <TextField
            fullWidth
            label="Search documents"
            placeholder="Search by ID, document, or status"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            sx={{ mt: 2 }}
          />
        </Paper>

        <Paper elevation={3}>
          {errorMessage && (
            <Alert severity="error" sx={{ m: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
              <CircularProgress aria-label="Loading uploaded documents" />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Document</b></TableCell>
                    <TableCell><b>Uploaded Date</b></TableCell>
                    <TableCell><b>Approval Progress</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell align="center"><b>Approval Cycle</b></TableCell>
                    <TableCell align="center"><b>Download</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No {statusTab.toLowerCase()} uploaded documents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>{document.id}</TableCell>
                        <TableCell>{document.original_file_name}</TableCell>
                        <TableCell>
                          {document.uploaded_datetime
                            ? new Date(document.uploaded_datetime).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {document.approved_approvals} of {document.total_approvers} approved
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={document.status}
                            color={
                              document.status === "Approved"
                                ? "success"
                                : document.status === "Rejected"
                                  ? "error"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelectedDocument(document)}
                          >
                            View Approval Cycle
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            aria-label="Download completed document"
                            title={
                              document.status === "Pending"
                                ? "Available after approval or rejection"
                                : "Download completed document"
                            }
                            variant="outlined"
                            size="small"
                            disabled={
                              document.status === "Pending" ||
                              !document.download_assignment_id
                            }
                            onClick={() => void handleDownload(document)}
                          >
                            <DownloadIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Dialog
        open={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Approval Cycle</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            {selectedDocument?.original_file_name}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Step</b></TableCell>
                  <TableCell><b>Approver</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Decision Date</b></TableCell>
                  <TableCell><b>Rejection Reason</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedDocument?.approval_cycle || []).map((approval) => (
                  <TableRow key={approval.assignment_id}>
                    <TableCell>{approval.approval_order}</TableCell>
                    <TableCell>{approval.approver_email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={approval.status}
                        color={
                          approval.status === "Approved"
                            ? "success"
                            : approval.status === "Rejected"
                              ? "error"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {approval.approved_datetime
                        ? new Date(approval.approved_datetime).toLocaleString()
                        : "Awaiting decision"}
                    </TableCell>
                    <TableCell>{approval.rejection_reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDocument(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UploadedDocuments;
