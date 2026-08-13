import API from "./api";

export const uploadDocuments = async (
  documents,
  uploadedBy,
  previewRefs,
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
        const previewElement = previewElements[index] || null;
        const previewRect = previewElement ? previewElement.getBoundingClientRect() : null;
        const approvalBoxConfig = (document.annotations || [])
            .filter((annotation) => annotation.type === "status")
            .map((annotation) => {
                const ratioConfig = previewRect
                    ? {
                          xRatio: annotation.x / previewRect.width,
                          yRatio: annotation.y / previewRect.height,
                          widthRatio: annotation.width / previewRect.width,
                          heightRatio: annotation.height / previewRect.height,
                      }
                    : {};

                return {
                    type: annotation.type,
                    x: annotation.x,
                    y: annotation.y,
                    width: annotation.width,
                    height: annotation.height,
                    fields: annotation.fields || [],
                    ...ratioConfig,
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
