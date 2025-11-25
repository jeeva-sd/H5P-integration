const path = require("path");
const H5P = require("@lumieducation/h5p-server");
const { MongoClient } = require("mongodb");
const { MongoS3ContentStorage, MongoS3LibraryStorage, MongoContentUserDataStorage } = require("@lumieducation/h5p-mongos3");
const SimplePermissionSystem = require("../models/PermissionSystem");
const { createAzureBlobAdapter } = require("./azureBlobAdapter");

/**
 * Initialize H5P Editor and Player with MongoDB and Azure Blob Storage
 * @param {Function} translationFn - Translation function callback
 * @returns {Object} - { h5pEditor, h5pPlayer, config }
 */
async function initializeH5P(translationFn) {
  try {
    console.log("Starting H5P initialization...");
    
    // 1. Load the configuration file
    console.log("Loading H5P configuration...");
    const config = await new H5P.H5PConfig(
      new H5P.fsImplementations.JsonStorage(path.resolve(__dirname, '../config.json'))
    ).load();
    console.log("H5P configuration loaded");

    // 2. MongoDB Configuration
    console.log("Connecting to MongoDB...");
    const mongoUrl = process.env.MONGODB_URL || "mongodb://root:rootpassword@localhost:27017";
    const mongoDbName = process.env.MONGODB_DB || "h5p_db";
    const mongoClient = await MongoClient.connect(mongoUrl, {
      auth: {
        username: process.env.MONGODB_USER || "root",
        password: process.env.MONGODB_PASSWORD || "rootpassword"
      },
      ignoreUndefined: true
    });
    
    const mongodb = mongoClient.db(mongoDbName);
    console.log(`Connected to MongoDB: ${mongoDbName}`);

    // 3. Azure Blob Storage Configuration
    console.log("Initializing Azure Blob Storage...");
    const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
      "DefaultEndpointsProtocol=https;AccountName=youraccountname;AccountKey=youraccountkey;EndpointSuffix=core.windows.net";
    
    const contentContainer = process.env.AZURE_CONTENT_CONTAINER || "h5p-content";
    const libraryContainer = process.env.AZURE_LIBRARY_CONTAINER || "h5p-libraries";
    const assetsPath = process.env.AZURE_ASSETS_PATH || "assets/lms/h5p/media";
    
    console.log(`   Container: ${contentContainer}`);
    console.log(`   Assets path: ${assetsPath}`);
    
    // Create Azure Blob adapters with base path for organized storage
    console.log("Creating content blob adapter...");
    const contentBlobAdapter = await createAzureBlobAdapter(
      azureConnectionString, 
      contentContainer,
      `${assetsPath}/content`
    );
    
    console.log("Creating library blob adapter...");
    const libraryBlobAdapter = await createAzureBlobAdapter(
      azureConnectionString, 
      libraryContainer,
      `${assetsPath}/libraries`
    );
    console.log(`Connected to Azure Blob Storage: ${contentContainer}`);
    console.log(`Content files will be stored at: ${assetsPath}/content`);
    console.log(`Library files will be stored at: ${assetsPath}/libraries`);

    // 4. Setup storage paths for temporary files (still using local filesystem)
    const temporaryPath = path.resolve(__dirname, "../h5p/temporary-storage");

    // 5. Create permission system
    const permissionSystem = new SimplePermissionSystem();

    // 6. Create URL Generator
    const urlGenerator = new H5P.UrlGenerator(config);

    // 7. Create MongoDB + Azure Blob storage instances
    console.log("Initializing library storage...");
    const libraryStorage = new MongoS3LibraryStorage(
      libraryBlobAdapter,
      mongodb.collection("h5p_libraries"),
      { s3Bucket: libraryContainer }
    );
    await libraryStorage.createIndexes();
    console.log("Library storage initialized");

    console.log("Initializing content storage...");
    const contentStorage = new MongoS3ContentStorage(
      contentBlobAdapter,
      mongodb.collection("h5p_content"),
      { s3Bucket: contentContainer }
    );
    console.log("Content storage initialized");

    console.log("Initializing content user data storage...");
    const contentUserDataStorage = new MongoContentUserDataStorage(
      mongodb.collection("h5p_user_data"),
      mongodb.collection("h5p_finished_data")
    );
    await contentUserDataStorage.createIndexes();
    console.log("Content user data storage initialized");

    // 8. Create H5PEditor with MongoDB + Azure Blob Storage
    console.log("Creating H5P Editor...");
    const h5pEditor = new H5P.H5PEditor(
      new H5P.fsImplementations.InMemoryStorage(), // key-value storage
      config,
      libraryStorage,
      contentStorage,
      new H5P.fsImplementations.DirectoryTemporaryFileStorage(temporaryPath),
      translationFn,
      urlGenerator,
      {
        permissionSystem,
        enableHubLocalization: true,
        enableLibraryNameLocalization: true
      },
      contentUserDataStorage
    );
    console.log("H5P Editor created");

    // 9. Create H5P Player
    console.log("Creating H5P Player...");
    const h5pPlayer = new H5P.H5PPlayer(
      h5pEditor.libraryStorage,
      h5pEditor.contentStorage,
      config,
      undefined,
      urlGenerator,
      undefined,
      { permissionSystem },
      h5pEditor.contentUserDataStorage
    );
    console.log("H5P Player created");

    // Set renderers to return raw model (for SPA)
    h5pEditor.setRenderer((model) => model);
    h5pPlayer.setRenderer((model) => model);

    console.log("H5P initialized successfully with MongoDB and Azure Blob Storage!");
    return { h5pEditor, h5pPlayer, config, mongoClient };
  } catch (error) {
    console.error("H5P initialization failed:", error);
    throw error;
  }
}

module.exports = initializeH5P;
