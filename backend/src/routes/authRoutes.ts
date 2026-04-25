import { Router } from "express";
import {
  register,
  login,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMe,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// Protected routes
router.get("/me", authenticateToken, getMe);

export default router;
