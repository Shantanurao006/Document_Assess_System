import API from "./api";

export const validateApprover = async (email) => {

    const response = await API.post("/approver/validate", {
        email,
    });

    return response.data;
};