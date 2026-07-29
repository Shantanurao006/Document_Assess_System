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

const formatApprovalFieldValue = (fieldLabel, entry) => {
    switch (fieldLabel) {
        case "Signature":
            return `Signature ${entry.approvalOrder}`;
        case "Approved By":
            return entry.approvedBy;
        case "Approved On":
            return entry.approvedOn;
        case "Status":
            return entry.status;
        default:
            return "";
    }
};

const getLayoutMetrics = (approvalRows, boxWidth, boxHeight, orderedFields) => {
    const fieldCount = Math.max(orderedFields.length, 1);
    const rowContentHeight = Math.max(52, 18 + (fieldCount * 12));
    const maxColumns = boxWidth >= 700 ? 3 : boxWidth >= 460 ? 2 : 1;
    const availableHeight = Math.max(80, boxHeight - 34);
    const rowsPerColumn = Math.max(1, Math.floor(availableHeight / rowContentHeight));
    const requiredColumns = Math.max(1, Math.ceil(Math.max(approvalRows.length, 1) / rowsPerColumn));
    const columnCount = Math.min(maxColumns, requiredColumns);
    const adjustedRowsPerColumn = Math.max(1, Math.ceil(Math.max(approvalRows.length, 1) / columnCount));
    const rowHeight = availableHeight / adjustedRowsPerColumn;
    const textSize = approvalRows.length >= 6 ? 7 : approvalRows.length >= 4 ? 8 : 9;
    const signatureHeight = Math.max(14, Math.min(26, rowHeight - 20));

    return {
        availableHeight,
        adjustedRowsPerColumn,
        columnCount,
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
    const page = pages[pages.length - 1];

    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const boxX = Math.max(12, Math.min(approvalBoxLayout.x, width - 140));
    const boxTop = Math.max(24, Math.min(approvalBoxLayout.y, height - 24));
    const boxWidth = Math.max(180, Math.min(approvalBoxLayout.width, width - boxX - 12));
    const boxHeight = Math.max(120, Math.min(approvalBoxLayout.height, height - boxTop - 12));
    const boxBottom = height - boxTop - boxHeight;
    const paddingX = 14;
    const paddingY = 12;
    const approvalRows = approvalEntries.length > 0 ? approvalEntries : [];
    const orderedFields = Array.isArray(approvalBoxLayout.fields) && approvalBoxLayout.fields.length > 0
        ? approvalBoxLayout.fields
        : DEFAULT_APPROVAL_FIELDS;
    const headingSize = approvalRows.length > 2 ? 11 : 12;
    const {
        availableHeight,
        adjustedRowsPerColumn,
        columnCount,
        rowHeight,
        textSize,
        signatureHeight,
    } = getLayoutMetrics(approvalRows, boxWidth, boxHeight, orderedFields);
    const columnGap = columnCount > 1 ? 16 : 0;
    const columnWidth = (boxWidth - (paddingX * 2) - (columnGap * (columnCount - 1))) / columnCount;
    const signatureWidth = Math.min(84, Math.max(48, columnWidth * 0.26));
    const contentTop = boxBottom + boxHeight - paddingY - 12;
    const contentLeft = boxX + paddingX;
    const detailStartOffset = signatureWidth + 16;
    const fieldCount = Math.max(orderedFields.length, 1);
    const fieldSpacing = Math.max(8, Math.min(12, Math.floor((rowHeight - 10) / fieldCount)));

    page.drawRectangle({
        x: boxX,
        y: boxBottom,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0.94, 0.67, 0.15),
        borderWidth: 1.5,
        color: rgb(1, 0.98, 0.94),
        opacity: 0.35,
        borderOpacity: 1,
    });

    page.drawText("Approval Box", {
        x: contentLeft,
        y: contentTop,
        size: headingSize,
        font,
        color: rgb(0.91, 0.43, 0),
    });

    for (let entryIndex = 0; entryIndex < approvalRows.length; entryIndex++) {
        const entry = approvalRows[entryIndex];
        const columnIndex = Math.floor(entryIndex / adjustedRowsPerColumn);
        const rowIndex = entryIndex % adjustedRowsPerColumn;
        const columnLeft = contentLeft + (columnIndex * (columnWidth + columnGap));
        const detailStartX = columnLeft + detailStartOffset;
        const rowTop = contentTop - 20 - (rowIndex * rowHeight);
        const signatureY = Math.max(boxBottom + 6, rowTop - signatureHeight - 4);

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
            const fieldY = rowTop - 2 - (fieldIndex * fieldSpacing);
            const labelX = fieldLabel === "Signature" ? columnLeft : detailStartX;
            const value = formatApprovalFieldValue(fieldLabel, entry);
            const renderedText =
                fieldLabel === "Signature"
                    ? value
                    : `${fieldLabel} : ${value}`;

            page.drawText(renderedText, {
                x: labelX,
                y: fieldY,
                size: textSize,
                font,
                color: rgb(0, 0, 0),
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
