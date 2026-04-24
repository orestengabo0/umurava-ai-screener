import type { Request, Response, NextFunction } from "express";
import { SettingsModel } from "../models/Settings.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const updateSettingsSchema = z.object({
  geminiApiKey: z.string().min(1, "API key is required"),
  geminiModel: z.string().min(1, "Model is required").default("gemini-2.5-flash-lite"),
});

// ─── GET /api/settings ────────────────────────────────────────
export async function getSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const settings = await SettingsModel.findOne({ userId });
    
    if (!settings) {
      res.json({
        geminiApiKey: "",
        geminiModel: "gemini-2.5-flash-lite",
        isActive: false,
        lastTestedAt: null,
        lastTestSuccess: null,
      });
      return;
    }

    // Return masked API key
    const maskedKey = settings.geminiApiKey
      ? settings.geminiApiKey.slice(0, 8) + "•".repeat(settings.geminiApiKey.length - 8)
      : "";

    res.json({
      geminiApiKey: maskedKey,
      geminiModel: settings.geminiModel,
      isActive: settings.isActive,
      lastTestedAt: settings.lastTestedAt,
      lastTestSuccess: settings.lastTestSuccess,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/settings ────────────────────────────────────────
export async function updateSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validationResult = updateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.issues,
      });
      return;
    }

    const { geminiApiKey, geminiModel } = validationResult.data;

    // Reject masked keys (containing bullet points)
    if (geminiApiKey.includes("•")) {
      res.status(400).json({ 
        message: "Cannot save masked API key. Please enter the full API key." 
      });
      return;
    }

    const settings = await SettingsModel.findOneAndUpdate(
      { userId },
      {
        geminiApiKey,
        geminiModel,
        isActive: true,
        lastTestedAt: undefined,
        lastTestSuccess: undefined,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Return masked API key
    const maskedKey = settings.geminiApiKey
      ? settings.geminiApiKey.slice(0, 8) + "•".repeat(settings.geminiApiKey.length - 8)
      : "";

    res.json({
      geminiApiKey: maskedKey,
      geminiModel: settings.geminiModel,
      isActive: settings.isActive,
      lastTestedAt: settings.lastTestedAt,
      lastTestSuccess: settings.lastTestSuccess,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/settings/test ───────────────────────────────────
export async function testSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { geminiApiKey, geminiModel } = req.body;

    if (!geminiApiKey) {
      res.status(400).json({ message: "API key is required" });
      return;
    }

    // Reject masked keys (containing bullet points)
    if (geminiApiKey.includes("•")) {
      res.status(400).json({ 
        success: false,
        message: "Cannot test masked API key. Please use 'Test Saved Key' button instead." 
      });
      return;
    }

    // Test the API key by making a simple request
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel || "gemini-2.5-flash-lite" });

    try {
      const result = await model.generateContent("Hello");
      const text = result.response.text();

      // Update settings with test result
      await SettingsModel.findOneAndUpdate(
        { userId },
        {
          geminiApiKey,
          geminiModel: geminiModel || "gemini-2.5-flash-lite",
          isActive: true,
          lastTestedAt: new Date(),
          lastTestSuccess: true,
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: "API key is valid and working",
      });
    } catch (error) {
      // Update settings with failed test result
      await SettingsModel.findOneAndUpdate(
        { userId },
        {
          geminiApiKey,
          geminiModel: geminiModel || "gemini-2.5-flash-lite",
          isActive: false,
          lastTestedAt: new Date(),
          lastTestSuccess: false,
        },
        { upsert: true, new: true }
      );

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Check for quota exceeded error
      if (errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("429")) {
        res.status(429).json({
          success: false,
          message: "API quota exceeded",
          error: errorMessage,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "Invalid API key or model",
        error: errorMessage,
      });
    }
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/settings/test-stored ───────────────────────────────
export async function testStoredSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get user's current settings from database
    const settings = await SettingsModel.findOne({ userId });
    
    if (!settings || !settings.geminiApiKey) {
      res.status(400).json({
        success: false,
        message: "No API key found. Please save your API key first.",
      });
      return;
    }

    // Test the stored API key
    const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: settings.geminiModel || "gemini-2.5-flash-lite" });

    try {
      const result = await model.generateContent("Hello");
      const text = result.response.text();

      // Update settings with test result
      await SettingsModel.findOneAndUpdate(
        { userId },
        {
          lastTestedAt: new Date(),
          lastTestSuccess: true,
        },
        { new: true }
      );

      res.json({
        success: true,
        message: "API key is valid and working",
      });
    } catch (error) {
      // Update settings with failed test result
      await SettingsModel.findOneAndUpdate(
        { userId },
        {
          lastTestedAt: new Date(),
          lastTestSuccess: false,
        },
        { new: true }
      );

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Check for quota exceeded error
      if (errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("429")) {
        res.status(429).json({
          success: false,
          message: "API quota exceeded",
          error: errorMessage,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "Invalid API key or model",
        error: errorMessage,
      });
    }
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/settings ─────────────────────────────────────
export async function deleteSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await SettingsModel.findOneAndDelete({ userId });

    res.json({ message: "Settings deleted successfully" });
  } catch (err) {
    next(err);
  }
}
