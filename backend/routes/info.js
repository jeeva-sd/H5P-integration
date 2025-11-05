const express = require("express");
const router = express.Router();

/**
 * Info Routes
 * Provides API information and server status
 */
router.get("/", (req, res) => {
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

module.exports = router;
