const express = require("express");
const router = express.Router();

/**
 * Content Routes
 * Handles all H5P content CRUD operations
 */
module.exports = function createContentRouter(h5pEditor, h5pPlayer) {
  // ----------------
  // 1. LIST ALL CONTENT
  // ----------------
  router.get("/", async (req, res) => {
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
  // 2. GET CONTENT METADATA
  // ----------------
  router.get("/:contentId", async (req, res) => {
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

  // ----------------
  // 3. GET CONTENT FOR EDITING
  // ----------------
  router.get("/:contentId/edit", async (req, res) => {
    try {
      const { contentId } = req.params;
      console.log(`✏️ Getting editor for content: ${contentId}`);

      // Get editor model (integration object, scripts, styles)
      const editorModel = await h5pEditor.render(
        contentId === "new" || contentId === "undefined" ? undefined : contentId,
        req.language || "en",
        req.user
      );

      // If editing existing content, get the content data and merge it
      if (contentId !== "new" && contentId !== "undefined") {
        const content = await h5pEditor.getContent(contentId, req.user);
        // Return the editorModel with content data merged in
        res.status(200).json({
          ...editorModel,
          library: content.library,
          params: content.params.params,
          metadata: content.params.metadata,
        });
      } else {
        // For new content, return editorModel directly
        res.status(200).json(editorModel);
      }
    } catch (error) {
      console.error("Error getting editor:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 4. GET CONTENT FOR PLAYING
  // ----------------
  router.get("/:contentId/play", async (req, res) => {
    try {
      const { contentId } = req.params;
      console.log(`▶️ Getting player for content: ${contentId}`);

      const playerModel = await h5pPlayer.render(
        contentId,
        req.user,
        req.language || "en"
      );

      res.status(200).json(playerModel);
    } catch (error) {
      console.error("Error getting player:", error);
      res.status(error.httpStatusCode || 500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 5. CREATE NEW CONTENT
  // ----------------
  router.post("/", async (req, res) => {
    try {
      // Match the official API structure
      let params, metadata, library;
      
      if (req.body.params && req.body.params.params && req.body.params.metadata) {
        // Official API format
        params = req.body.params.params;
        metadata = req.body.params.metadata;
        library = req.body.library;
      } else {
        // Fallback to direct format
        params = req.body.params;
        metadata = req.body.metadata;
        library = req.body.library;
      }

      if (!params || !metadata || !library) {
        return res.status(400).json({ success: false, error: "Malformed request" });
      }

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
      res.status(200).json({ success: true, contentId, metadata: savedMetadata });
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 6. UPDATE EXISTING CONTENT
  // ----------------
  router.put("/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      // Match the official API structure
      let params, metadata, library;
      
      if (req.body.params && req.body.params.params && req.body.params.metadata) {
        params = req.body.params.params;
        metadata = req.body.params.metadata;
        library = req.body.library;
      } else {
        params = req.body.params;
        metadata = req.body.metadata;
        library = req.body.library;
      }

      if (!params || !metadata || !library) {
        return res.status(400).json({ success: false, error: "Malformed request" });
      }

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
      res.status(200).json({ success: true, contentId: id, metadata: savedMetadata });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------
  // 7. DELETE CONTENT
  // ----------------
  router.delete("/:contentId", async (req, res) => {
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

  return router;
};
