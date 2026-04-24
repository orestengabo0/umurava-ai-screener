import { Router } from "express";
import { screenApplicantsHandler } from "../controllers/screenController.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();

// All screen routes require authentication
router.use(authenticateToken);

// POST /api/screen - Screen applicants using Gemini
router.post("/", screenApplicantsHandler);

export default router;
