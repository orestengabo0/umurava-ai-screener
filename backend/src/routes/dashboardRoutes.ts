import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All dashboard routes require authentication
router.use(authenticateToken);

router.get("/stats", getDashboardStats);

export default router;
