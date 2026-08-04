const service = require("../services/approver.service");

const validateApprover = async (req, res) => {
    try {

        const { email } = req.body;

        const user = await service.validateApprover(email);

        return res.status(200).json({
            success: true,
            message: "Approver is valid.",
            data: user,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

const approveDocument = async (req, res) => {

    try {

        console.log("===== APPROVE DOCUMENT =====");
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        const result = await service.approveDocument(
            req.body,
            req.file
        );

        console.log("RESULT:", result);

        return res.status(200).json({
            success: true,
            message: "Document approved successfully.",
            data: result,
        });

    } catch (error) {

        console.error("ERROR:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });

    }

};
const getLastSignature = async (req, res) => {
    try {
        const { adminId } = req.params;
        const result = await service.getLastSignatureForAdmin(adminId);
        if (!result) {
            return res.status(200).json({ success: true, data: null });
        }

        // expose a public URL to the signature file
        const proto = req.get("x-forwarded-proto") || req.protocol;
        const host = req.get("x-forwarded-host") || req.get("host");
        const baseUrl = process.env.BASE_URL || `${proto}://${host}`;
        const url = `${baseUrl}/uploads/signatures/${result.filename}`;
        return res.status(200).json({ success: true, data: { filename: result.filename, url } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    validateApprover,
    approveDocument,
    getLastSignature,
};
