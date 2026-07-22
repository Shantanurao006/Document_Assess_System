import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getMyDocuments = async (email) => {

    const response = await axios.get(
        `${BASE_URL}/api/document/my-documents/${email}`
    );

    return response.data;
};

export const downloadSignedPdf = async (documentId) => {

    const response = await axios.get(
        `${BASE_URL}/api/document/download/${documentId}`,
        {
            responseType: "blob",
        }
    );

    return response.data;
};