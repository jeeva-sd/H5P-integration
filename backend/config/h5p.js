const path = require("path");
const H5P = require("@lumieducation/h5p-server");
const SimplePermissionSystem = require("../models/PermissionSystem");

/**
 * Initialize H5P Editor and Player
 * @param {Function} translationFn - Translation function callback
 * @returns {Object} - { h5pEditor, h5pPlayer, config }
 */
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
    const librariesPath = path.resolve(__dirname, "../h5p/libraries");
    const contentPath = path.resolve(__dirname, "../h5p/content");
    const temporaryPath = path.resolve(__dirname, "../h5p/temporary-storage");
    const userDataPath = path.resolve(__dirname, "../h5p/user-data");

    // 3. Create permission system
    const permissionSystem = new SimplePermissionSystem();

    // 4. Create H5PEditor manually to ensure translation function is passed correctly
    const h5pEditor = new H5P.H5PEditor(
      new H5P.fsImplementations.InMemoryStorage(), // key-value storage
      config,
      new H5P.fsImplementations.FileLibraryStorage(librariesPath),
      new H5P.fsImplementations.FileContentStorage(contentPath),
      new H5P.fsImplementations.DirectoryTemporaryFileStorage(temporaryPath),
      translationFn, // Pass the translation function here
      undefined, // url generator (optional)
      {
        permissionSystem,
        enableHubLocalization: true,
        enableLibraryNameLocalization: true
      },
      new H5P.fsImplementations.FileContentUserDataStorage(userDataPath)
    );

    // 5. Create H5P Player
    const h5pPlayer = new H5P.H5PPlayer(
      h5pEditor.libraryStorage,
      h5pEditor.contentStorage,
      config,
      undefined,
      undefined,
      undefined,
      { permissionSystem },
      h5pEditor.contentUserDataStorage
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

module.exports = initializeH5P;
