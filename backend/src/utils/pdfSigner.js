const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const signPdf = async (
    pdfPath,
    signaturePath,
    status,
    approvalDateTime
) => {

    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);

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

    page.drawText(
        `Approved On : ${approvalDateTime}`,
        {
            x: 50,
            y: 100,
            size: 12,
            font,
        }
    );

    page.drawImage(signatureImage, {
        x: width - 180,
        y: 50,
        width: 120,
        height: 60,
    });

    const signedPdf = await pdfDoc.save();

    const signedFolder = path.join(
    __dirname,
    "../uploads",
    "signed"
);

if (!fs.existsSync(signedFolder)) {
    fs.mkdirSync(signedFolder, {
        recursive: true,
    });
}

const outputPath = path.join(
    signedFolder,
    path.basename(pdfPath).replace(
        ".pdf",
        "_signed.pdf"
    )
);

fs.writeFileSync(outputPath, signedPdf);

return outputPath;
};

module.exports = signPdf;