require("dotenv").config();

const app = require("./app");
const ensureSchema = require("./config/ensureSchema");

const PORT = process.env.PORT || 5000;

ensureSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database schema check failed");
        console.error(error);
        process.exit(1);
    });
