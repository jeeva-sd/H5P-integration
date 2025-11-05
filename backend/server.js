const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const i18next = require("i18next");
const i18nextFsBackend = require("i18next-fs-backend");
const i18nextHttpMiddleware = require("i18next-http-middleware");
const H5P = require("@lumieducation/h5p-server");
const {
  h5pAjaxExpressRouter,
  libraryAdministrationExpressRouter,
  contentTypeCacheExpressRouter,
} = require("@lumieducation/h5p-express");

const app = express();
const PORT = 4000;

// ============================================
// USER CLASS (Required by H5P)
// ============================================
class User {
  constructor(id, name, email, role) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.type = "local";
  }
}

// ============================================
// PERMISSION SYSTEM (Required for H5P)
// ============================================
class SimplePermissionSystem {
  async checkForUserData(actingUser, permission, contentId, affectedUserId) {
    if (!actingUser) return false;
    // Allow teachers and admins to manage user data
    return actingUser.role === 'teacher' || actingUser.role === 'admin';
  }

  async checkForContent(actingUser, permission, contentId) {
    if (!actingUser) return false;
    // Allow teachers to create, edit, delete, view content
    return actingUser.role === 'teacher' || actingUser.role === 'admin';
  }

  async checkForTemporaryFile(user, permission, filename) {
    if (!user || user.role === 'anonymous') return false;
    // Allow all authenticated users to upload temporary files
    return true;
  }

  async checkForGeneralAction(actingUser, permission) {
    if (!actingUser) return false;
    
    const H5PPermissions = H5P;
    
    // Allow teachers to install libraries (important for the editor!)
    if (actingUser.role === 'teacher' || actingUser.role === 'admin') {
      // These permissions are needed for installing content types from H5P Hub
      return true;
    }
    
    return false;
  }
}

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

// ============================================
// SIMPLE USER SYSTEM (for demonstration)
// ============================================
const DEMO_USERS = {
  teacher: { id: "teacher", name: "Teacher", email: "teacher@example.com", role: "teacher" },
  student: { id: "student", name: "Student", email: "student@example.com", role: "student" },
  anonymous: { id: "anonymous", name: "Anonymous", email: "", role: "anonymous" },
};

// Simple middleware to inject user (in production, use proper auth)
app.use((req, res, next) => {
  const userId = req.headers["x-user-id"] || "teacher";
  const userData = DEMO_USERS[userId] || DEMO_USERS.anonymous;
  req.user = new User(
    userData.id,
    userData.name,
    userData.email,
    userData.role
  );
  next();
});

// ============================================
// H5P INITIALIZATION
// ============================================
async function initializeH5P(translationFn) {
  try {
    // 1. Create H5P configuration
    const config = new H5P.H5PConfig(
      new H5P.fsImplementations.InMemoryStorage(),
      {
        baseUrl: "/h5p",
        contentFilesUrl: "/h5p/content",
        coreUrl: "/h5p/core",
        editorUrl: "/h5p/editor",
        librariesUrl: "/h5p/libraries",
      }
    );

    // 2. Setup storage paths
    const librariesPath = path.resolve(__dirname, "h5p/libraries");
    const contentPath = path.resolve(__dirname, "h5p/content");
    const temporaryPath = path.resolve(__dirname, "h5p/temporary-storage");
    const userDataPath = path.resolve(__dirname, "h5p/user-data");

    // 3. Create permission system
    const permissionSystem = new SimplePermissionSystem();

    // 4. Create H5P Editor (the main component) with permission system
    // Now using the properly initialized translation function passed as parameter
    const h5pEditor = await H5P.fs(
      config,
      librariesPath,
      contentPath,
      temporaryPath,
      translationFn,
      undefined,
      {
        permissionSystem
      }
    );

    // 5. Create H5P Player
    const h5pPlayer = new H5P.H5PPlayer(
      h5pEditor.libraryStorage,
      h5pEditor.contentStorage,
      config
    );

    // Set renderers to return raw model (for SPA)
    h5pEditor.setRenderer((model) => model);
    h5pPlayer.setRenderer((model) => model);

    console.log("✅ H5P initialized successfully!");
    return { h5pEditor, h5pPlayer, config };
  } catch (error) {
    console.error("❌ H5P initialization failed:", error);
    throw error;
  }
}

// ============================================
// CUSTOM REST API ROUTES
// ============================================
function setupCustomRoutes(h5pEditor, h5pPlayer) {
  // ----------------
  // 1. LIST ALL CONTENT
  // ----------------
  app.get("/api/content", async (req, res) => {
    try {
      console.log("📋 Listing all content...");
      const contentIds = await h5pEditor.contentManager.listContent(req.user);
      
      const contentList = await Promise.all(
        contentIds.map(async (id) => {
          const metadata = await h5pEditor.contentManager.getContentMetadata(id, req.user);
          return {
            contentId: id,
            title: metadata.title,
            mainLibrary: metadata.mainLibrary,
            createdAt: metadata.createdAt || new Date().toISOString(),
          };
        })
      );

      res.json({ success: true, content: contentList });
    } catch (error) {
      console.error("Error listing content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 2. GET CONTENT FOR EDITING
  // ----------------
  app.get("/api/content/:contentId/edit", async (req, res) => {
    try {
      const { contentId } = req.params;
      console.log(`✏️ Getting editor for content: ${contentId}`);

      // Get editor model (integration object, scripts, styles)
      const editorModel = await h5pEditor.render(
        contentId === "new" ? undefined : contentId,
        req.language || "en",
        req.user
      );

      // If editing existing content, get the content data and merge it
      if (contentId !== "new") {
        const content = await h5pEditor.getContent(contentId, req.user);
        // Return the editorModel with content data merged in (matching h5p-react expectations)
        res.json({
          ...editorModel,
          library: content.library,
          params: content.params.params,
          metadata: content.params.metadata,
        });
      } else {
        // For new content, return editorModel directly
        res.json(editorModel);
      }
    } catch (error) {
      console.error("Error getting editor:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 3. GET CONTENT FOR PLAYING
  // ----------------
  app.get("/api/content/:contentId/play", async (req, res) => {
    try {
      const { contentId } = req.params;
      console.log(`▶️ Getting player for content: ${contentId}`);

      const playerModel = await h5pPlayer.render(
        contentId,
        req.user,
        req.language || "en"
      );

      res.json({ success: true, playerModel });
    } catch (error) {
      console.error("Error getting player:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 4. CREATE NEW CONTENT
  // ----------------
  app.post("/api/content", async (req, res) => {
    try {
      const { library, params, metadata } = req.body;
      console.log("➕ Creating new content...");

      const { id: contentId, metadata: savedMetadata } =
        await h5pEditor.saveOrUpdateContentReturnMetaData(
          undefined,
          params,
          metadata,
          library,
          req.user
        );

      console.log(`✅ Content created with ID: ${contentId}`);
      res.json({ success: true, contentId, metadata: savedMetadata });
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 5. UPDATE EXISTING CONTENT
  // ----------------
  app.put("/api/content/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      const { library, params, metadata } = req.body;
      console.log(`💾 Updating content: ${contentId}`);

      const { id, metadata: savedMetadata } =
        await h5pEditor.saveOrUpdateContentReturnMetaData(
          contentId,
          params,
          metadata,
          library,
          req.user
        );

      console.log(`✅ Content updated: ${contentId}`);
      res.json({ success: true, contentId: id, metadata: savedMetadata });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 6. DELETE CONTENT
  // ----------------
  app.delete("/api/content/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      console.log(`🗑️ Deleting content: ${contentId}`);

      await h5pEditor.deleteContent(contentId, req.user);

      console.log(`✅ Content deleted: ${contentId}`);
      res.json({ success: true, message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 7. GET CONTENT METADATA
  // ----------------
  app.get("/api/content/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      const metadata = await h5pEditor.contentManager.getContentMetadata(
        contentId,
        req.user
      );
      res.json({ success: true, metadata });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// ============================================
// H5P AJAX ROUTES (Required for H5P to work)
// ============================================
function setupH5PRoutes(h5pEditor, config) {
  // Serve H5P core files statically
  app.use('/h5p/core', express.static(path.resolve(__dirname, 'h5p/core')));
  app.use('/h5p/editor', express.static(path.resolve(__dirname, 'h5p/editor')));

  // H5P Ajax endpoints (required for editor/player functionality)
  app.use(
    config.baseUrl,
    h5pAjaxExpressRouter(
      h5pEditor,
      path.resolve(__dirname, "h5p/core"),
      path.resolve(__dirname, "h5p/editor")
    )
  );

  // Library administration endpoints
  app.use(
    `${config.baseUrl}/libraries`,
    libraryAdministrationExpressRouter(h5pEditor)
  );

  // Content type cache endpoints
  app.use(
    `${config.baseUrl}/content-type-cache`,
    contentTypeCacheExpressRouter(h5pEditor.contentTypeCache)
  );
}

// ============================================
// INFO ROUTE
// ============================================
app.get("/api/info", (req, res) => {
  res.json({
    message: "H5P Backend Server",
    version: "1.0.0",
    endpoints: {
      listContent: "GET /api/content",
      getContent: "GET /api/content/:contentId",
      createContent: "POST /api/content",
      updateContent: "PUT /api/content/:contentId",
      deleteContent: "DELETE /api/content/:contentId",
      editContent: "GET /api/content/:contentId/edit",
      playContent: "GET /api/content/:contentId/play",
    },
    user: req.user,
  });
});

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

    // STEP 3: Now initialize H5P with the proper translation callback
    // The key is wrapping the i18next t function to match H5P's expected signature
    const { h5pEditor, h5pPlayer, config } = await initializeH5P(
      (key, language) => translationFunction(key, { lng: language })
    );
    
    // STEP 4: Set up routes
    setupCustomRoutes(h5pEditor, h5pPlayer);
    setupH5PRoutes(h5pEditor, config);

    app.listen(PORT, () => {
      console.log(`🚀 H5P Backend Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
