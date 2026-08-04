const db = require("../config/db");

const findUserByEmail = async (email) => {
    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0];
};

const findUserById = async (id) => {
    const result = await db.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
    );

    return result.rows[0];
};

const createUser = async (email, hashedPin, role) => {
    const result = await db.query(
        `INSERT INTO users (email, pin, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [email, hashedPin, role]
    );

    return result.rows[0];
};

const updateUserPin = async (userId, hashedPin) => {
    const result = await db.query(
        `UPDATE users SET pin = $1 WHERE id = $2 RETURNING id, email, role`,
        [hashedPin, userId]
    );

    return result.rows[0];
};

module.exports = {
    findUserByEmail,
    createUser,
    updateUserPin,
};