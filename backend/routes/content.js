const express = require("express");
const router = express.Router();

/**
 * Content Routes - Matching Official H5P REST API Implementation
 * Handles all H5P content CRUD operations
 */
module.exports = function createContentRouter(h5pEditor, h5pPlayer) {
  // ----------------
  // 1. LIST ALL CONTENT
  // ----------------
  router.get("/", async (req, res) => {
    try {
      const contentIds = await h5pEditor.contentManager.listContent(req.user);
      
      const contentObjects = await Promise.all(
        contentIds.map(async (id) => ({
          content: await h5pEditor.contentManager.getContentMetadata(id, req.user),
          id
        }))
      );

      // Match official API response format
      res.status(200).send(
        contentObjects.map((o) => ({
          contentId: o.id,
          title: o.content.title,
          mainLibrary: o.content.mainLibrary
        }))
      );
    } catch (error) {
      console.error("Error listing content:", error);
      res.status(500).send(`Error listing content: ${error.message}`);
    }
  });

  // ----------------
  // 2. GET CONTENT FOR EDITING
  // ----------------
  router.get("/:contentId/edit", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      // Match official implementation - handle 'undefined' string
      const editorModel = await h5pEditor.render(
        contentId === "new" || contentId === "undefined" ? undefined : contentId,
        req.language || "en",
        req.user
      );

      // If editing existing content, get the content data and merge it
      if (contentId !== "new" && contentId !== "undefined") {
        const content = await h5pEditor.getContent(contentId, req.user);
        res.status(200).send({
          ...editorModel,
          library: content.library,
          metadata: content.params.metadata,
          params: content.params.params
        });
      } else {
        // For new content, return editorModel directly
        res.status(200).send(editorModel);
      }
    } catch (error) {
      console.error("Error getting editor:", error);
      res.status(error.httpStatusCode || 500).send(error.message);
    }
  });

  // ----------------
  // 3. GET CONTENT FOR PLAYING
  // ----------------
  router.get("/:contentId/play", async (req, res) => {
    try {
      const { contentId } = req.params;

      const playerModel = await h5pPlayer.render(
        contentId,
        req.user,
        req.language || "en"
      );

      res.status(200).send(playerModel);
    } catch (error) {
      console.error("Error getting player:", error);
      res.status(error.httpStatusCode || 500).send(error.message);
    }
  });

  // ----------------
  // 4. CREATE NEW CONTENT
  // ----------------
  router.post("/", async (req, res) => {
    try {
      // Match official API structure validation
      if (
        !req.body.params ||
        !req.body.params.params ||
        !req.body.params.metadata ||
        !req.body.library ||
        !req.user
      ) {
        return res.status(400).send('Malformed request');
      }

      const { id: contentId, metadata } =
        await h5pEditor.saveOrUpdateContentReturnMetaData(
          undefined,
          req.body.params.params,
          req.body.params.metadata,
          req.body.library,
          req.user
        );

      // Match official response format
      res.status(200).json({ contentId, metadata });
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).send(error.message);
    }
  });

  // ----------------
  // 5. UPDATE EXISTING CONTENT (using PATCH like official)
  // ----------------
  router.patch("/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      // Match official API structure validation
      if (
        !req.body.params ||
        !req.body.params.params ||
        !req.body.params.metadata ||
        !req.body.library ||
        !req.user
      ) {
        return res.status(400).send('Malformed request');
      }

      const { id, metadata } =
        await h5pEditor.saveOrUpdateContentReturnMetaData(
          contentId.toString(),
          req.body.params.params,
          req.body.params.metadata,
          req.body.library,
          req.user
        );

      // Match official response format
      res.status(200).json({ contentId: id, metadata });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).send(error.message);
    }
  });

  // ----------------
  // 6. DELETE CONTENT
  // ----------------
  router.delete("/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      await h5pEditor.deleteContent(contentId, req.user);

      // Match official response format
      res.status(200).send(`Content ${contentId} successfully deleted.`);
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).send(
        `Error deleting content with id ${req.params.contentId}: ${error.message}`
      );
    }
  });

  return router;
};
