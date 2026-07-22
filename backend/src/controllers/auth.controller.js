const service = require("../services/auth.service");

const register = async (req, res) => {

    try {

        const { email, pin, isAdmin } = req.body;

        const user = await service.register(email, pin, isAdmin);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

const login = async (req, res) => {

    try {

        const { email, pin } = req.body;

        const user = await service.login(email, pin);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user
        });

    } catch (error) {

        res.status(401).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    register,
    login
};