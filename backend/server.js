// Load environment variables
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const i18next = require("i18next");
const i18nextFsBackend = require("i18next-fs-backend");
const i18nextHttpMiddleware = require("i18next-http-middleware");

// Import modular components
const authMiddleware = require("./middleware/auth");
const initializeH5P = require("./config/h5p");
const createContentRouter = require("./routes/content");
const createH5PRouter = require("./routes/h5p");
const infoRouter = require("./routes/info");

const app = express();
const PORT = 4000;

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Apply authentication middleware
app.use(authMiddleware);

// ============================================
// START SERVER
// ============================================
async function startServer() {
  try {
    // STEP 1: Initialize i18next and get the translation function
    const translationFunction = await i18next
      .use(i18nextFsBackend)
      .use(i18nextHttpMiddleware.LanguageDetector)
      .init({
        backend: {
          loadPath: path.join(
            __dirname,
            "../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json"
          ),
        },
        debug: false,
        defaultNS: "server",
        fallbackLng: "en",
        ns: [
          "client",
          "server",
          "storage-file-implementations",
        ],
        preload: ["en"],
      });

    // STEP 2: Set up the translation middleware for Express routes
    app.use(i18nextHttpMiddleware.handle(i18next));

    // STEP 3: Initialize H5P with the proper translation callback
    const { h5pEditor, h5pPlayer, config } = await initializeH5P(
      (key, language) => translationFunction(key, { lng: language })
    );
    
    // STEP 4: Set up API routes
    app.use("/api/info", infoRouter);
    app.use("/api/content", createContentRouter(h5pEditor, h5pPlayer));
    
    // STEP 5: Set up H5P system routes
    app.use("/h5p", createH5PRouter(h5pEditor, config));

    // STEP 6: Start listening
    app.listen(PORT, () => {
      console.log(`H5P Backend Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
