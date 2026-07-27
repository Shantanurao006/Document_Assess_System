require("dotenv").config();

const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,

    ssl: isProduction
        ? {
              rejectUnauthorized: false,
          }
        : false,
});

// Test Database Connection
(async () => {
    try {
        const client = await pool.connect();

        console.log("====================================");
        console.log("✅ PostgreSQL Connected Successfully");
        console.log("Host     :", process.env.DB_HOST);
        console.log("Database :", process.env.DB_NAME);
        console.log("Port     :", process.env.DB_PORT);
        console.log("====================================");

        client.release();
    } catch (error) {
        console.error("====================================");
        console.error("❌ Database Connection Failed");
        console.error(error);
        console.error("====================================");
    }
})();

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL Error");
    console.error(err);
});

process.on("SIGINT", async () => {
    await pool.end();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await pool.end();
    process.exit(0);
});

module.exports = pool;