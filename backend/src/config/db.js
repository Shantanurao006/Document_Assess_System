require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Verify database connection and print database details
(async () => {
    try {
        const dbInfo = await pool.query(
            "SELECT current_database(), current_schema();"
        );

        console.log("========================================");
        console.log("Database Connection Successful");
        console.log("Connected to:", dbInfo.rows[0]);

        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("Tables in public schema:");
        console.table(tables.rows);

        console.log("========================================");
    } catch (err) {
        console.error("Database Connection Error:");
        console.error(err);
    }
})();

module.exports = pool;