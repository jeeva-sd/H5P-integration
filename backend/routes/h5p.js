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

  // Serve content files from storage (for video playback, images, etc.)
  // Use a more specific pattern that works with Express v5
  router.get(/^\/content\/([^\/]+)\/(.+)$/, async (req, res) => {
    try {
      const contentId = req.params[0];
      const file = req.params[1];
      const user = req.user;

      // Get the file from storage
      const fileStream = await h5pEditor.contentManager.getContentFileStream(
        contentId,
        file,
        user
      );

      // Set appropriate content type
      const contentType = getContentType(file);
      res.setHeader('Content-Type', contentType);
      
      // Enable range requests for video streaming
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Allow cross-origin requests if needed
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Pipe the stream to response
      fileStream.on('error', (error) => {
        console.error(`Error streaming file ${contentId}/${file}:`, error);
        if (!res.headersSent) {
          res.status(404).send('File not found');
        }
      });

      fileStream.pipe(res);

    } catch (error) {
      console.error('Error serving content file:', error);
      if (!res.headersSent) {
        res.status(500).send('Error loading file');
      }
    }
  });

  // Download endpoint for H5P content packages
  router.get('/download/:contentId', async (req, res) => {
    try {
      const { contentId } = req.params;
      const user = req.user;

      console.log(`📥 Download request for content: ${contentId}`);

      // Get content metadata to use as filename
      const metadata = await h5pEditor.contentManager.getContentMetadata(contentId, user);
      const filename = `${metadata.title || 'content'}.h5p`.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      // Get the package from H5P editor
      const packageStream = await h5pEditor.exportContent(contentId, user);

      // Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe the stream to response
      packageStream.pipe(res);

      packageStream.on('error', (error) => {
        console.error('Error streaming package:', error);
        if (!res.headersSent) {
          res.status(500).send('Error downloading content');
        }
      });

    } catch (error) {
      console.error('Error in download endpoint:', error);
      if (!res.headersSent) {
        res.status(500).send(`Error downloading content: ${error.message}`);
      }
    }
  });

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

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'json': 'application/json',
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'pdf': 'application/pdf',
    'txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
