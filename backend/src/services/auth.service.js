const bcrypt = require("bcrypt");
const repository = require("../repositories/auth.repository");

const register = async (email, pin, isAdmin) => {

    const existingUser = await repository.findUserByEmail(email);

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const role = isAdmin ? "ADMIN" : "USER";

    return await repository.createUser(email, hashedPin, role);
};

const login = async (email, pin) => {

    console.log("Login Request:");
    console.log("Email:", email);
    console.log("PIN:", pin);
    
    const user = await repository.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid Email or PIN");
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
        throw new Error("Invalid Email or PIN");
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role
    };
};

module.exports = {
    register,
    login
};