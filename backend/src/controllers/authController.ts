import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  type RegisterData,
  type LoginData,
} from "../services/auth.js";

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

// ─── POST /api/auth/register ───────────────────────────────────────────────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.issues,
      });
      return;
    }

    const data = validationResult.data as RegisterData;
    const result = await registerUser(data);

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "User with this email already exists") {
      res.status(409).json({ message: err.message });
      return;
    }
    next(err);
  }
}

// ─── POST /api/auth/login ───────────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.issues,
      });
      return;
    }

    const data = validationResult.data as LoginData;
    const result = await loginUser(data);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid email or password") {
      res.status(401).json({ message: err.message });
      return;
    }
    next(err);
  }
}

// ─── POST /api/auth/forgot-password ────────────────────────────────────────
export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.issues,
      });
      return;
    }

    const { email } = validationResult.data;
    await forgotPassword(email);

    res.json({
      message: "Password reset email sent successfully",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "User with this email does not exist") {
      res.status(404).json({ message: err.message });
      return;
    }
    next(err);
  }
}

// ─── POST /api/auth/reset-password ─────────────────────────────────────────
export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.issues,
      });
      return;
    }

    const { token, newPassword } = validationResult.data;
    await resetPassword(token, newPassword);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid or expired reset token") {
      res.status(400).json({ message: err.message });
      return;
    }
    next(err);
  }
}

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // This endpoint requires authentication middleware
    // The user object is attached to req by the middleware
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    res.json({
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
}
