import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();

// All dashboard routes require authentication
router.use(authenticateToken);

router.get("/stats", getDashboardStats);

export default router;
