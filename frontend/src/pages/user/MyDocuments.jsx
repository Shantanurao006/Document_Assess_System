import { useEffect, useState } from "react";

import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
} from "@mui/material";

import {
    getMyDocuments,
    downloadSignedPdf,
} from "../../api/documentApi";

function MyDocuments() {

    const [documents, setDocuments] = useState([]);

const user = JSON.parse(
    localStorage.getItem("user") || "null"
);

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

}, []);


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
        <Box sx={{ p: 4 }}>

            <Typography
                variant="h4"
                fontWeight="bold"
                mb={3}
            >
                My Documents
            </Typography>

            <TableContainer
                component={Paper}
                elevation={3}
            >

                <Table>

                    <TableHead>

                        <TableRow>

                            <TableCell><b>Document Name</b></TableCell>

                            <TableCell><b>Approver</b></TableCell>

                            <TableCell><b>Status</b></TableCell>

                            <TableCell><b>Uploaded On</b></TableCell>

                            <TableCell><b>Approved On</b></TableCell>

                            <TableCell align="center">
                                <b>Download</b>
                            </TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {documents.map((doc) => (

                            <TableRow key={doc.id}>

                                <TableCell>
                                    {doc.original_file_name}
                                </TableCell>

                                <TableCell>
                                    {doc.approver_email || "-"}
                                </TableCell>

                                <TableCell>
                                    {doc.status}
                                </TableCell>

                                <TableCell>
                                    {doc.uploaded_datetime}
                                </TableCell>

                                <TableCell>
                                    {doc.approved_datetime || "-"}
                                </TableCell>

                                <TableCell align="center">

                                    {doc.status === "Approved" ? (

                                        <Button
    variant="contained"
    size="small"
    onClick={() =>
        handleDownload(
            doc.id,
            doc.signed_pdf_name
        )
    }
>
    Download
</Button>
                                    ) : (

                                        "-"

                                    )}

                                </TableCell>

                            </TableRow>

                        ))}

                    </TableBody>

                </Table>

            </TableContainer>

        </Box>
    );
}

export default MyDocuments;