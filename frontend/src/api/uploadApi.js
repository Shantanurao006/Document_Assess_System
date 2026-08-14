import API from "./api";

export const uploadDocuments = async (
  documents,
  uploadedBy,
  approvalPositions,
  documentNotes
) => {

    const formData = new FormData();

    formData.append("uploadedBy", uploadedBy);

    documents.forEach((document, index) => {

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
    .map((annotation, annotationIndex) => {
        const position =
            approvalPositions[index]?.[annotationIndex] || {};

        return {
            type: annotation.type,
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            fields: annotation.fields || [],
            xRatio: position.x,
            yRatio: position.y,
            widthRatio: position.width,
            heightRatio: position.height,
        };
    });
        formData.append(
            "approverEmails",
            JSON.stringify(approverEmails)
        );
        formData.append(
    "approvalBoxConfig",
    JSON.stringify(approvalBoxConfig)
);

formData.append(
    "approvalPositions",
    JSON.stringify(approvalPositions[index] || [])
);

formData.append(
  "documentNotes",
  documentNotes[index] || ""
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
