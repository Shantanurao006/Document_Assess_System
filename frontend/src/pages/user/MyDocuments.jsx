import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    IconButton,
    Tab,
    Tabs,
    TextField,
    Tooltip,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
    getMyDocuments,
    downloadSignedPdf,
} from "../../api/documentApi";
import { clearUserSession, getStoredUser } from "../../auth/session";
import { API_BASE_URL } from "../../api/api";

function MyDocuments() {

    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [statusTab, setStatusTab] = useState("Pending");
    const [searchText, setSearchText] = useState("");

const user = getStoredUser();

useEffect(() => {

    const loadDocuments = async () => {

        try {

            const data = await getMyDocuments(
                user.email
            );

            setDocuments(data);

        } catch (error) {

            console.error(error);

        }

    };

    if (user?.email) {
        loadDocuments();
    }

}, [user?.email]);


const handleLogout = () => {
    clearUserSession();
    navigate("/");
};

const handleDownload = async (documentId, fileName) => {

    try {

        const blob = await downloadSignedPdf(documentId);

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = fileName;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (error) {

        console.error(error);

        alert("Unable to download document.");

    }

};

const handleViewUploadedFile = (storedFileName) => {

    if (!storedFileName) {
        alert("Uploaded file is not available.");
        return;
    }

    window.open(
        `${API_BASE_URL}/uploads/${storedFileName}`,
        "_blank",
        "noopener,noreferrer"
    );

};

const filteredDocuments = [...documents]
    .sort(
        (firstDoc, secondDoc) =>
            new Date(secondDoc.uploaded_datetime).getTime() -
            new Date(firstDoc.uploaded_datetime).getTime()
    )
    .filter((doc) => doc.status === statusTab)
    .filter((doc) => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return [
            doc.id,
            doc.original_file_name,
            doc.approver_email,
            doc.status,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });

return (
  <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>

    {/* Header */}

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

        {user?.role !== "ADMIN" && (
          <Button
            variant="contained"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={() => navigate("/user/dashboard")}
          >
            Home
          </Button>
        )}

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
        My Documents
      </Typography>

      <Typography
        color="text.secondary"
        mb={3}
      >
        Documents uploaded by you.
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={statusTab}
          onChange={(_, nextValue) => setStatusTab(nextValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Pending" value="Pending" />
          <Tab label="Approved" value="Approved" />
          <Tab label="Rejected" value="Rejected" />
        </Tabs>

        <TextField
          fullWidth
          label="Search documents"
          placeholder="Search by ID, document, approver, or status"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </Paper>

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
                  <b>Approver</b>
                </TableCell>

                <TableCell>
                  <b>Uploaded Date</b>
                </TableCell>

                <TableCell>
                  <b>Progress</b>
                </TableCell>

                <TableCell>
                  <b>Rejection Reason</b>
                </TableCell>

                <TableCell>
                  <b>Status</b>
                </TableCell>

                <TableCell align="center">
                  <b>View</b>
                </TableCell>

                <TableCell align="center">
                  <b>Download</b>
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {filteredDocuments.length === 0 ? (

                <TableRow>

                  <TableCell
                    colSpan={9}
                    align="center"
                  >
                    No Documents Found
                  </TableCell>

                </TableRow>

              ) : (

                filteredDocuments.map((doc) => (

                  <TableRow key={doc.id}>

                    <TableCell>
                      {doc.id}
                    </TableCell>

                    <TableCell>
                      {doc.original_file_name}
                    </TableCell>

                    <TableCell>
                      {doc.approver_email || "-"}
                    </TableCell>

                    <TableCell>
  {doc.uploaded_datetime
    ? new Date(doc.uploaded_datetime).toLocaleString()
    : "-"}
</TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {doc.completed_approvals} of {doc.total_approvers} approvals completed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.status === "Approved"
                          ? "Final signed PDF is ready"
                          : doc.status === "Rejected"
                          ? "Approval chain stopped"
                          : "Waiting for the current approver"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>
                      {doc.status === "Rejected" ? doc.rejection_reason || "-" : "-"}
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
  <Tooltip title="View Uploaded Document">
    <span>
      <IconButton
        color="primary"
        onClick={() => handleViewUploadedFile(doc.stored_file_name)}
      >
        <VisibilityIcon />
      </IconButton>
    </span>
  </Tooltip>
</TableCell>

<TableCell align="center">
  <Tooltip
    title={
      doc.status === "Approved"
        ? "Download Signed Document"
        : doc.status === "Rejected"
        ? "Download Rejected Document"
        : "Document is pending approval"
    }
  >
    <span>
      <IconButton
        color="primary"
        disabled={doc.status === "Pending"}
        onClick={() => {
          if (doc.status === "Approved" || doc.status === "Rejected") {
            handleDownload(
              doc.id,
              doc.signed_pdf_name
            );
          }
        }}
      >
        <DownloadIcon />
      </IconButton>
    </span>
  </Tooltip>
</TableCell>

                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        </TableContainer>

      </Paper>

    </Box>

  </Box>
);
}

export default MyDocuments;
