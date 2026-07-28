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
    Tooltip,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import {
    getMyDocuments,
    downloadSignedPdf,
} from "../../api/documentApi";
import { clearUserSession, getStoredUser } from "../../auth/session";

function MyDocuments() {

    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);

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
        My Documents
      </Typography>

      <Typography
        color="text.secondary"
        mb={3}
      >
        Documents uploaded by you.
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
                  <b>Approver</b>
                </TableCell>

                <TableCell>
                  <b>Uploaded Date</b>
                </TableCell>

                <TableCell>
                  <b>Status</b>
                </TableCell>

                <TableCell align="center">
                  <b>Download</b>
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {documents.length === 0 ? (

                <TableRow>

                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    No Documents Found
                  </TableCell>

                </TableRow>

              ) : (

                documents.map((doc) => (

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
  <Tooltip
    title={
      doc.status === "Approved"
        ? "Download Signed Document"
        : doc.status === "Rejected"
        ? "Document was rejected"
        : "Document is pending approval"
    }
  >
    <span>
      <IconButton
        color="primary"
        disabled={doc.status !== "Approved"}
        onClick={() => {
          if (doc.status === "Approved") {
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
