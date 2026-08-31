const fs = require("fs");
const path = require("path");
const {
    PDFDocument,
    rgb,
    StandardFonts,
    degrees,
} = require("pdf-lib");
const { ensureUploadDirectories, signedDir } = require("../config/uploadPaths");

const DEFAULT_APPROVAL_FIELDS = [
    "Signature",
    "Approved By",
    "Approved On",
    "Status",
];

const DISPLAY_APPROVAL_FIELDS = [
    "Approved On",
];

const REJECTED_APPROVAL_FIELDS = [
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
        case "Approved On":
            return formatApprovalDate(entry.approvedOn);
        case "Status":
            return entry.status;
        default:
            return "";
    }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getApprovalDrawTransform = (
    position,
    pageWidth,
    pageHeight,
    rotation
) => {
    if (!position) {
        return null;
    }

    const normalizedRotation = ((rotation % 360) + 360) % 360;

    const x = position.x;
    const y = position.y;
    const width = position.width;
    const height = position.height;

    switch (normalizedRotation) {
        case 90:
            return {
                x: (y + height) * pageWidth,
                y: x * pageHeight,
                width: width * pageHeight,
                height: height * pageWidth,
                rotate: degrees(90),
            };

        case 180:
            return {
                x: (1 - x - width) * pageWidth,
                y: y * pageHeight,
                width: width * pageWidth,
                height: height * pageHeight,
                rotate: degrees(180),
            };

        case 270:
            return {
                x: (1 - y - height) * pageWidth,
                y: (1 - x) * pageHeight,
                width: width * pageHeight,
                height: height * pageWidth,
                rotate: degrees(270),
            };

        case 0:
        default:
            return {
                x: x * pageWidth,
                y: (1 - y - height) * pageHeight,
                width: width * pageWidth,
                height: height * pageHeight,
                rotate: degrees(0),
            };
    }
};
const getPdfPositionFromVisualPosition = (
    position,
    width,
    height,
    rotation
) => {
    if (!position) {
        return null;
    }

    const normalizedRotation = ((rotation % 360) + 360) % 360;

    const x = position.x;
    const y = position.y;
    const boxWidth = position.width;
    const boxHeight = position.height;

    switch (normalizedRotation) {
        case 90:
            return {
                x: y * width,
                y: x * height,
                width: boxWidth * width,
                height: boxHeight * height,
            };

        case 180:
            return {
                x: (1 - x - boxWidth) * width,
                y: y * height,
                width: boxWidth * width,
                height: boxHeight * height,
            };

        case 270:
            return {
                x: (1 - y - boxHeight) * width,
                y: (1 - x - boxWidth) * height,
                width: boxWidth * width,
                height: boxHeight * height,
            };

        case 0:
        default:
            return {
                x: x * width,
                y: (1 - y - boxHeight) * height,
                width: boxWidth * width,
                height: boxHeight * height,
            };
    }
};

const getLayoutMetrics = (
    approvalRows,
    boxWidth,
    boxHeight,
    orderedFields,
    cardWidth,
    columnGap
) => {
    const fieldCount = Math.max(orderedFields.length, 1);
    const rowContentHeight = Math.max(104, 36 + (fieldCount * 16));

    const maxColumns = Math.min(
        3,
        Math.max(1, approvalRows.length)
    );

    const availableHeight = Math.max(80, boxHeight - 34);

    const columnCount = maxColumns;

    const rowCount = Math.max(
        1,
        Math.ceil(
            Math.max(approvalRows.length, 1) / columnCount
        )
    );

    const rowHeight = availableHeight / rowCount;

    const textSize =
        approvalRows.length >= 6
            ? 7
            : approvalRows.length >= 4
                ? 8
                : 9;

    const signatureHeight = Math.max(
        18,
        Math.min(34, rowHeight * 0.34)
    );

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
    approvalBoxLayout,
    approvalPositions = []
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
    let page = pages[0];

    let { width, height } = page.getSize();
    let rotation = page.getRotation().angle;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const boxX = Math.max(
    12,
    approvalBoxLayout.xRatio != null
        ? Math.round(approvalBoxLayout.xRatio * width)
        : approvalBoxLayout.x
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

    const boxYFromTop =
    approvalBoxLayout.yRatio != null
        ? Math.round(approvalBoxLayout.yRatio * height)
        : approvalBoxLayout.y;

    const boxBottom = clamp(
    height - boxYFromTop - boxHeight,
    12,
    Math.max(12, height - boxHeight - 12)
);
    const paddingX = 14;
    const paddingY = 12;
    const approvalRows = approvalEntries.length > 0 ? approvalEntries : [];
    const configuredFields = Array.isArray(approvalBoxLayout.fields) && approvalBoxLayout.fields.length > 0
        ? approvalBoxLayout.fields
        : DEFAULT_APPROVAL_FIELDS;
    const orderedFields = DISPLAY_APPROVAL_FIELDS.filter((fieldLabel) =>
        configuredFields.includes(fieldLabel)
    );
    const columnGap = 20;
const desiredColumns = Math.min(3, Math.max(1, approvalRows.length));
const cardWidth = Math.max(
    80,
    (boxWidth - (paddingX * 2) - ((desiredColumns - 1) * columnGap)) /
        desiredColumns
);
    const {
        columnCount,
        rowCount,
        rowHeight,
        textSize,
        signatureHeight,
    } = getLayoutMetrics(approvalRows, boxWidth, boxHeight, orderedFields, cardWidth, columnGap);
    // Professional spacing between approvers
    // Fixed-size approval cards for a clean professional layout
const contentTop = boxBottom + boxHeight - paddingY;

    // Center the approval cards inside the approval box
const contentLeft = boxX + paddingX;
const fieldCount = Math.max(orderedFields.length, 1);
const fieldSpacing = Math.max(
    11,
    Math.min(
        16,
        Math.floor(
            (rowHeight - signatureHeight - paddingY) / fieldCount
        )
    )
);
    //page.drawRectangle({
      //  x: boxX,
        //y: boxBottom,
        //width: boxWidth,
        //height: boxHeight,
        //color: rgb(1, 0.98, 0.94),
        //opacity: 0.35,
    //});

    for (let entryIndex = 0; entryIndex < approvalRows.length; entryIndex++) {
        const entry = approvalRows[entryIndex];
        const entryFields = entry.status === "Rejected"
            ? REJECTED_APPROVAL_FIELDS
            : orderedFields;
const position = approvalPositions[entryIndex];

const pageNumber = Number(position?.page_number ?? position?.pageNumber ?? 1);
page = pages[Math.min(Math.max(pageNumber, 1), pages.length) - 1];
({ width, height } = page.getSize());
rotation = page.getRotation().angle;

const approvalTransform = position
    ? getApprovalDrawTransform(
        position,
        width,
        height,
        rotation
    )
    : null;

const signatureWidth = approvalTransform
    ? approvalTransform.width
    : Math.min(90, cardWidth);

const signatureHeightValue = approvalTransform
    ? approvalTransform.height
    : signatureHeight;

const columnIndex = entryIndex % columnCount;
const rowIndex = Math.floor(entryIndex / columnCount);

const columnLeft = approvalTransform
    ? approvalTransform.x
    : boxX +
    paddingX +
    (columnIndex * (cardWidth + columnGap));

const signatureY = approvalTransform
    ? approvalTransform.y
    : (contentTop - (rowIndex * rowHeight) - signatureHeight);

        const detailsTopY = signatureY - 16;

        if (entry.status !== "Rejected" && entry.signaturePath && fs.existsSync(entry.signaturePath)) {
            const signatureBytes = fs.readFileSync(entry.signaturePath);
            const signatureImage = entry.signaturePath.toLowerCase().endsWith(".png")
                ? await pdfDoc.embedPng(signatureBytes)
                : await pdfDoc.embedJpg(signatureBytes);

            page.drawImage(signatureImage, {
                x: columnLeft,
                y: signatureY,
                width: signatureWidth,
                height: signatureHeightValue,
                rotate: approvalTransform
                    ? approvalTransform.rotate
                    : degrees(0),
            });
        }

        entryFields.forEach((fieldLabel, fieldIndex) => {
    const fieldY = Math.max(
        boxBottom + paddingY,
        detailsTopY - (fieldIndex * fieldSpacing)
    );

    const value = formatApprovalFieldValue(fieldLabel, entry);

    if (fieldLabel === "Approved On") {
    page.drawText(value, {
        x: columnLeft,
        y: fieldY,
        size: textSize,
        font,
        color: rgb(0, 0, 0),
        rotate: approvalTransform
            ? approvalTransform.rotate
            : degrees(0),
    });
    } else {
        page.drawText(`${fieldLabel} :`, {
            x: columnLeft,
            y: fieldY,
            size: textSize,
            font,
            color: rgb(0, 0, 0),
        });

        page.drawText(value, {
            x: columnLeft + 78,
            y: fieldY,
            size: textSize,
            font: fieldLabel === "Status" ? boldFont : font,
            color:
                fieldLabel === "Status" && value === "Rejected"
                    ? rgb(0.85, 0, 0)
                    : rgb(0, 0, 0),
        });
    }
});
    }

    const signedPdf = await pdfDoc.save();

    ensureUploadDirectories();

    // Write back to the same output path so subsequent approvals append to this file.
    fs.writeFileSync(outputPath, signedPdf);

    return outputPath;
};

module.exports = signPdf;
