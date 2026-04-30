import type { Request, Response, NextFunction } from "express";
import { SettingsModel } from "../models/Settings.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const updateSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
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
    const userRole = (req as any).user?.role;
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

    // Only SUPER_ADMIN can update the API key
    if (geminiApiKey && userRole !== "SUPER_ADMIN") {
      res.status(403).json({ 
        message: "Only SUPER_ADMIN can update the API key. You can only change your model preference." 
      });
      return;
    }

    // If API key is provided (by SUPER_ADMIN), validate it's not masked
    if (geminiApiKey) {
      // Reject masked keys (containing bullet points)
      if (geminiApiKey.includes("•")) {
        res.status(400).json({ 
          message: "Cannot save masked API key. Please enter the full API key." 
        });
        return;
      }
    }

    // If only model is being updated, get existing API key
    let finalApiKey = geminiApiKey;
    if (!finalApiKey) {
      const existingSettings = await SettingsModel.findOne({ userId });
      if (existingSettings && existingSettings.geminiApiKey) {
        finalApiKey = existingSettings.geminiApiKey;
      } else {
        // For non-SUPER_ADMIN users without an existing key, they need to use the system key
        // They can only update their model preference
        if (userRole !== "SUPER_ADMIN") {
          // Save only the model preference without an API key
          const settings = await SettingsModel.findOneAndUpdate(
            { userId },
            {
              geminiModel,
              isActive: true,
              lastTestedAt: undefined,
              lastTestSuccess: undefined,
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
          );

          res.json({
            geminiApiKey: "",
            geminiModel: settings.geminiModel,
            isActive: settings.isActive,
            lastTestedAt: settings.lastTestedAt,
            lastTestSuccess: settings.lastTestSuccess,
          });
          return;
        }
        
        res.status(400).json({ 
          message: "API key is required when no existing key found." 
        });
        return;
      }
    }

    const settings = await SettingsModel.findOneAndUpdate(
      { userId },
      {
        geminiApiKey: finalApiKey,
        geminiModel,
        isActive: true,
        lastTestedAt: undefined,
        lastTestSuccess: undefined,
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
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
        { upsert: true, returnDocument: 'after' }
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
        { upsert: true, returnDocument: 'after' }
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
    const userRole = (req as any).user?.role;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let apiKey: string | null = null;
    let model: string = "gemini-2.5-flash-lite";

    // If user is SUPER_ADMIN, use their own stored key
    if (userRole === "SUPER_ADMIN") {
      const settings = await SettingsModel.findOne({ userId });
      if (!settings || !settings.geminiApiKey) {
        res.status(400).json({
          success: false,
          message: "No API key found. Please save your API key first.",
        });
        return;
      }
      apiKey = settings.geminiApiKey;
      model = settings.geminiModel || "gemini-2.5-flash-lite";
    } else {
      // For RECRUITERs, use the SUPER_ADMIN's API key
      const { UserModel } = await import("../models/User.js");
      const superAdmin = await UserModel.findOne({ role: "SUPER_ADMIN" });
      
      if (superAdmin) {
        const adminSettings = await SettingsModel.findOne({ userId: superAdmin._id.toString(), isActive: true });
        if (adminSettings && adminSettings.geminiApiKey) {
          apiKey = adminSettings.geminiApiKey;
          model = adminSettings.geminiModel || "gemini-2.5-flash-lite";
        }
      }
      
      // If no SUPER_ADMIN key, try environment variable
      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || null;
      }
      
      if (!apiKey) {
        res.status(400).json({
          success: false,
          message: "No API key configured. Please contact your administrator to set up the API key.",
        });
        return;
      }
    }

    // Test the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    try {
      const result = await geminiModel.generateContent("Hello");
      const text = result.response.text();

      // Update user's settings with test result (for SUPER_ADMIN) or just model preference (for RECRUITER)
      if (userRole === "SUPER_ADMIN") {
        await SettingsModel.findOneAndUpdate(
          { userId },
          {
            lastTestedAt: new Date(),
            lastTestSuccess: true,
          },
          { returnDocument: 'after' }
        );
      } else {
        // For RECRUITERs, update their model preference and test status
        const userSettings = await SettingsModel.findOne({ userId });
        if (userSettings) {
          await SettingsModel.findOneAndUpdate(
            { userId },
            {
              geminiModel: model,
              lastTestedAt: new Date(),
              lastTestSuccess: true,
            },
            { returnDocument: 'after' }
          );
        } else {
          // Create settings for RECRUITER with model preference
          await SettingsModel.create({
            userId,
            geminiModel: model,
            isActive: true,
            lastTestedAt: new Date(),
            lastTestSuccess: true,
          });
        }
      }

      res.json({
        success: true,
        message: "API configuration is working",
      });
    } catch (error) {
      // Update settings with failed test result
      if (userRole === "SUPER_ADMIN") {
        await SettingsModel.findOneAndUpdate(
          { userId },
          {
            lastTestedAt: new Date(),
            lastTestSuccess: false,
          },
          { returnDocument: 'after' }
        );
      } else {
        const userSettings = await SettingsModel.findOne({ userId });
        if (userSettings) {
          await SettingsModel.findOneAndUpdate(
            { userId },
            {
              lastTestedAt: new Date(),
              lastTestSuccess: false,
            },
            { returnDocument: 'after' }
          );
        }
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for quota exceeded error
      if (errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("429")) {
        res.status(429).json({
          success: false,
          message: "API quota exceeded. Please contact your administrator to update the API key.",
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
