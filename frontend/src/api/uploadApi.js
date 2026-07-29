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

        const approverEmails = (document.approvers || []).map(
            (approver) => approver.email
        );
        const approvalBoxConfig = (document.annotations || [])
            .filter((annotation) => annotation.type === "status")
            .map((annotation) => ({
                type: annotation.type,
                x: annotation.x,
                y: annotation.y,
                width: annotation.width,
                height: annotation.height,
                fields: annotation.fields || [],
            }));

        formData.append(
            "approverEmails",
            JSON.stringify(approverEmails)
        );
        formData.append(
            "approvalBoxConfig",
            JSON.stringify(approvalBoxConfig)
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
