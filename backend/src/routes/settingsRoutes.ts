import { Router } from "express";
import {
  getSettingsHandler,
  updateSettingsHandler,
  testSettingsHandler,
  testStoredSettingsHandler,
  deleteSettingsHandler,
} from "../controllers/settingsController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All settings routes require authentication
router.use(authenticateToken);

// GET /api/settings - Get user's settings
router.get("/", getSettingsHandler);

// PUT /api/settings - Update user's settings
router.put("/", updateSettingsHandler);

// POST /api/settings/test - Test API key with provided key
router.post("/test", testSettingsHandler);

// POST /api/settings/test-stored - Test stored API key from database
router.post("/test-stored", testStoredSettingsHandler);

// DELETE /api/settings - Delete user's settings
router.delete("/", deleteSettingsHandler);

export default router;
