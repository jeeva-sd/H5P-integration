const express = require("express");
const path = require("path");
const {
  h5pAjaxExpressRouter,
  libraryAdministrationExpressRouter,
  contentTypeCacheExpressRouter,
} = require("@lumieducation/h5p-express");

/**
 * H5P System Routes
 * Handles H5P core functionality (Ajax, libraries, content types)
 */
module.exports = function createH5PRouter(h5pEditor, config) {
  const router = express.Router();

  // Serve H5P core files statically
  router.use('/core', express.static(path.resolve(__dirname, '../h5p/core')));
  router.use('/editor', express.static(path.resolve(__dirname, '../h5p/editor')));

  // H5P Ajax endpoints (required for editor/player functionality)
  router.use(
    "/",
    h5pAjaxExpressRouter(
      h5pEditor,
      path.resolve(__dirname, "../h5p/core"),
      path.resolve(__dirname, "../h5p/editor")
    )
  );

  // Library administration endpoints
  router.use(
    "/libraries",
    libraryAdministrationExpressRouter(h5pEditor)
  );

  // Content type cache endpoints
  router.use(
    "/content-type-cache",
    contentTypeCacheExpressRouter(h5pEditor.contentTypeCache)
  );

  return router;
};
