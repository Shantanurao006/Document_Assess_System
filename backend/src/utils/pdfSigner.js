const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { ensureUploadDirectories, signedDir } = require("../config/uploadPaths");

const DEFAULT_APPROVAL_FIELDS = [
    "Signature",
    "Approved By",
    "Approved On",
    "Status",
];

const DISPLAY_APPROVAL_FIELDS = [
    "Approved By",
    "Approved On",
    "Status",
];

const formatApprovalDate = (value) => {
    const parsedDate = value ? new Date(value) : null;

    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        return value || "";
    }

    const month = parsedDate.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
    });
    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const year = parsedDate.getUTCFullYear();
    const hours = String(parsedDate.getUTCHours()).padStart(2, "0");
    const minutes = String(parsedDate.getUTCMinutes()).padStart(2, "0");

    return `${month} ${day} ${year} ${hours}:${minutes}`;
};

const formatApprovalFieldValue = (fieldLabel, entry) => {
    switch (fieldLabel) {
        case "Approved By":
            return entry.approvedBy;
        case "Approved On":
            return formatApprovalDate(entry.approvedOn);
        case "Status":
            return entry.status;
        default:
            return "";
    }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getLayoutMetrics = (approvalRows, boxWidth, boxHeight, orderedFields) => {
    const fieldCount = Math.max(orderedFields.length, 1);
    const rowContentHeight = Math.max(104, 36 + (fieldCount * 16));
    // Always allow up to 3 approvers side by side
const maxColumns = Math.min(3, Math.max(1, approvalRows.length));
    const availableHeight = Math.max(80, boxHeight - 34);
    const rowsPerColumn = Math.max(1, Math.floor(availableHeight / rowContentHeight));
    const requiredColumns = Math.max(1, Math.ceil(Math.max(approvalRows.length, 1) / rowsPerColumn));
    const columnCount = Math.min(maxColumns, requiredColumns);
    const rowCount = Math.max(1, Math.ceil(Math.max(approvalRows.length, 1) / columnCount));
    const rowHeight = availableHeight / rowCount;
    const textSize = approvalRows.length >= 6 ? 7 : approvalRows.length >= 4 ? 8 : 9;
    const signatureHeight = Math.max(18, Math.min(34, rowHeight * 0.34));

    return {
        columnCount,
        rowCount,
        rowHeight,
        textSize,
        signatureHeight,
    };
};

const signPdf = async (
    pdfPath,
    approvalEntries,
    approvalBoxLayout
) => {

        // Determine output signed path (preserve case-insensitive .pdf)
        const outputPath = path.join(
            signedDir,
            path.basename(pdfPath).replace(/\.pdf$/i, "_signed.pdf")
        );

        // Rebuild from the original upload each time so stacked approvals do not overwrite each other.
        const pdfBytes = fs.readFileSync(pdfPath);

        const pdfDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
        });

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const boxX = clamp(
        approvalBoxLayout.xRatio != null ? Math.round(approvalBoxLayout.xRatio * width) : approvalBoxLayout.x,
        12,
        Math.max(12, width - 180 - 12)
    );

    const boxWidth = clamp(
        approvalBoxLayout.widthRatio != null ? Math.round(approvalBoxLayout.widthRatio * width) : approvalBoxLayout.width,
        180,
        Math.max(180, width - boxX - 12)
    );

    const boxHeight = clamp(
        approvalBoxLayout.heightRatio != null ? Math.round(approvalBoxLayout.heightRatio * height) : approvalBoxLayout.height,
        120,
        Math.max(120, height - 12)
    );

    const boxYFromTop = approvalBoxLayout.yRatio != null ? Math.round(approvalBoxLayout.yRatio * height) : approvalBoxLayout.y;
    const boxBottom = clamp(height - boxYFromTop - boxHeight, 12, Math.max(12, height - boxHeight - 12));
    const paddingX = 14;
    const paddingY = 12;
    const approvalRows = approvalEntries.length > 0 ? approvalEntries : [];
    const configuredFields = Array.isArray(approvalBoxLayout.fields) && approvalBoxLayout.fields.length > 0
        ? approvalBoxLayout.fields
        : DEFAULT_APPROVAL_FIELDS;
    const orderedFields = DISPLAY_APPROVAL_FIELDS.filter((fieldLabel) =>
        configuredFields.includes(fieldLabel)
    );
    const {
        columnCount,
        rowCount,
        rowHeight,
        textSize,
        signatureHeight,
    } = getLayoutMetrics(approvalRows, boxWidth, boxHeight, orderedFields);
    // Professional spacing between approvers
    // Fixed-size approval cards for a clean professional layout
const columnGap = 60;
const cardWidth = 250;
const signatureWidth = 90;

const contentTop = boxBottom + boxHeight - paddingY - 8;

// Center the approval cards inside the approval box
const totalCardsWidth =
    (columnCount * cardWidth) +
    ((columnCount - 1) * columnGap);

const contentLeft =
    boxX + Math.max(
        paddingX,
        (boxWidth - totalCardsWidth) / 2
    );
    const fieldCount = Math.max(orderedFields.length, 1);
    const fieldSpacing = Math.max(11, Math.min(16, Math.floor((rowHeight - signatureHeight - 20) / fieldCount)));

    page.drawRectangle({
        x: boxX,
        y: boxBottom,
        width: boxWidth,
        height: boxHeight,
        color: rgb(1, 0.98, 0.94),
        opacity: 0.35,
    });

    for (let entryIndex = 0; entryIndex < approvalRows.length; entryIndex++) {
        const entry = approvalRows[entryIndex];
        const columnIndex = entryIndex % columnCount;
        const rowIndex = Math.floor(entryIndex / columnCount);
        const columnLeft = contentLeft + (columnIndex * (cardWidth + columnGap));
        const rowTop = contentTop - (rowIndex * rowHeight);
        const signatureY = Math.max(boxBottom + 10, rowTop - signatureHeight);
        const detailsTopY = signatureY - 16;

        if (entry.signaturePath && fs.existsSync(entry.signaturePath)) {
            const signatureBytes = fs.readFileSync(entry.signaturePath);
            const signatureImage = entry.signaturePath.toLowerCase().endsWith(".png")
                ? await pdfDoc.embedPng(signatureBytes)
                : await pdfDoc.embedJpg(signatureBytes);

            page.drawImage(signatureImage, {
                x: columnLeft,
                y: signatureY,
                width: signatureWidth,
                height: signatureHeight,
            });
        }

        orderedFields.forEach((fieldLabel, fieldIndex) => {
            const fieldY = detailsTopY - (fieldIndex * fieldSpacing);
            let value = formatApprovalFieldValue(fieldLabel, entry);

            page.drawText(`${fieldLabel} :`, {
    x: columnLeft,
    y: fieldY,
    size: textSize,
    font,
    color: rgb(0,0,0),
});

page.drawText(value, {
    x: columnLeft + 78,
    y: fieldY,
    size: textSize,
    font,
    color: rgb(0,0,0),
});
        });
    }

    const signedPdf = await pdfDoc.save();

    ensureUploadDirectories();

    // Write back to the same output path so subsequent approvals append to this file.
    fs.writeFileSync(outputPath, signedPdf);

    return outputPath;
};

module.exports = signPdf;
