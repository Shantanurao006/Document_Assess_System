import axios from "axios";
import { API_BASE_URL } from "./api";

export const getMyDocuments = async (email) => {

    const response = await axios.get(
        `${API_BASE_URL}/api/document/my-documents/${email}`
    );

    return response.data;
};

export const downloadSignedPdf = async (documentId) => {

    const response = await axios.get(
        `${API_BASE_URL}/api/document/download/${documentId}`,
        {
            responseType: "blob",
        }
    );

    return response.data;
};
