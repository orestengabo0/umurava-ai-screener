import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.ts";

const router = Router();

router.get("/stats", getDashboardStats);

export default router;
