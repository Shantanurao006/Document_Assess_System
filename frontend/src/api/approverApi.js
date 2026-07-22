import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

export const validateApprover = async (email) => {

    const response = await API.post("/approver/validate", {
        email,
    });

    return response.data;
};