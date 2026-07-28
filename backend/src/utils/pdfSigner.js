const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { ensureUploadDirectories, signedDir } = require("../config/uploadPaths");

const signPdf = async (
    pdfPath,
    signaturePath,
    status,
    approvalDateTime,
    approvedBy
) => {

        // Determine output signed path (preserve case-insensitive .pdf)
        const outputPath = path.join(
            signedDir,
            path.basename(pdfPath).replace(/\.pdf$/i, "_signed.pdf")
        );

        // If a signed version already exists, load that first so signatures accumulate.
        const sourcePath = fs.existsSync(outputPath) ? outputPath : pdfPath;

        const pdfBytes = fs.readFileSync(sourcePath);

        const pdfDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
        });

    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];

    const { width } = page.getSize();

    const signatureBytes = fs.readFileSync(signaturePath);

    const signatureImage = signaturePath.endsWith(".png")
        ? await pdfDoc.embedPng(signatureBytes)
        : await pdfDoc.embedJpg(signatureBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(`Status : ${status}`, {
        x: 50,
        y: 120,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Approved On : ${approvalDateTime}`, {
        x: 50,
        y: 100,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Approved By : ${approvedBy}`, {
        x: 50,
        y: 80,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawImage(signatureImage, {
        x: width - 180,
        y: 50,
        width: 120,
        height: 60,
    });

    const signedPdf = await pdfDoc.save();

    ensureUploadDirectories();

    // Write back to the same output path so subsequent approvals append to this file.
    fs.writeFileSync(outputPath, signedPdf);

    return outputPath;
};

module.exports = signPdf;
