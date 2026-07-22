import API from "./api";

export const uploadDocuments = async (
    documents,
    uploadedBy
) => {

    const formData = new FormData();

    formData.append("uploadedBy", uploadedBy);

    documents.forEach((document) => {

        if (document.file) {
            formData.append(
                "documents",
                document.file
            );
        }

        formData.append(
            "approverEmails",
            document.approverEmail
        );
    });

    const response = await API.post(
        "/upload",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};