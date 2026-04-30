import { GoogleGenerativeAI } from "@google/generative-ai";
import { SettingsModel } from "../models/Settings.js";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(userId?: string): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function getGeminiClientForUser(userId: string): Promise<{ client: GoogleGenerativeAI; model: string }> {
  // Try to get user's settings from database
  const settings = await SettingsModel.findOne({ userId, isActive: true });
  
  // If user has their own API key (SUPER_ADMIN only), use it
  if (settings && settings.geminiApiKey) {
    return {
      client: new GoogleGenerativeAI(settings.geminiApiKey),
      model: settings.geminiModel || "gemini-2.5-flash-lite",
    };
  }
  
  // Otherwise, use the SUPER_ADMIN's API key from settings
  // Find any SUPER_ADMIN with an active API key
  const { UserModel } = await import("../models/User.js");
  const superAdmin = await UserModel.findOne({ role: "SUPER_ADMIN" });
  
  if (superAdmin) {
    const adminSettings = await SettingsModel.findOne({ userId: superAdmin._id.toString(), isActive: true });
    if (adminSettings && adminSettings.geminiApiKey) {
      // Use SUPER_ADMIN's API key with user's model preference
      const model = settings?.geminiModel || adminSettings.geminiModel || "gemini-2.5-flash-lite";
      return {
        client: new GoogleGenerativeAI(adminSettings.geminiApiKey),
        model,
      };
    }
  }
  
  // Final fallback to environment variable if no SUPER_ADMIN key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No Gemini API key configured. Please contact your administrator to set up the API key in Settings.");
  }
  
  // Use the user's model preference if available, otherwise default
  const model = settings?.geminiModel || "gemini-2.5-flash-lite";
  
  return {
    client: new GoogleGenerativeAI(apiKey),
    model,
  };
}

interface GenerateJsonParams {
  resumeText: string;
  jobContext?: {
    title: string;
    description: string;
    requiredSkills?: string[];
    requirements?: string[];
    experienceLevel?: string;
    minExperience?: number;
    employmentType?: string;
    location?: string;
    educationLevel?: string;
  };
  userId?: string;
}

export async function generateJsonFromResumeText({
  resumeText,
  jobContext,
  userId,
}: GenerateJsonParams): Promise<string> {
  const { client, model: defaultModel } = userId 
    ? await getGeminiClientForUser(userId)
    : { client: getGeminiClient(), model: "gemini-2.5-flash-lite" };
  
  const modelsToTry = [defaultModel];
  const maxAttemptsPerModel = 1;

  let jobBlock = "";
  if (jobContext) {
    jobBlock = `
  JOB CONTEXT:
  - Title: ${jobContext.title}
  - Description: ${jobContext.description}
  - Required Skills: ${jobContext.requiredSkills?.join(", ") || "N/A"}
  - Requirements: ${jobContext.requirements?.join("; ") || "N/A"}
  - Experience Level: ${jobContext.experienceLevel || "N/A"}
  - Min Years Experience: ${jobContext.minExperience || "N/A"}
  - Employment Type: ${jobContext.employmentType || "N/A"}
  `;
  }

  const prompt = `
  Extract applicant information from the RESUME TEXT and output a single JSON object matching the EXACT Umurava Talent Profile Schema below.
  
  STRICT OUTPUT RULES:
  - Output ONLY raw JSON (no markdown, no code fences, no comments).
  - Use double quotes for all keys and string values.
  - Use null for unknown scalars and [] for unknown lists.
  - DO NOT deviate from the key names (notice spaces in some keys).
  
  SCHEMA:
  {
    "isResume": boolean,
    "First Name": string,
    "Last Name": string,
    "Email": string,
    "Headline": string,
    "Bio": string | null,
    "Location": string,
    "skills": [
      {
        "name": string,
        "level": "Beginner" | "Intermediate" | "Advanced" | "Expert",
        "yearsOfExperience": number | null
      }
    ],
    "languages": [
      {
        "name": string,
        "proficiency": "Basic" | "Conversational" | "Fluent" | "Native"
      }
    ],
    "experience": [
      {
        "company": string,
        "role": string,
        "Start Date": "YYYY-MM",
        "End Date": "YYYY-MM | Present",
        "description": string,
        "technologies": string[],
        "Is Current": boolean
      }
    ],
    "education": [
      {
        "institution": string,
        "degree": string,
        "Field of Study": string,
        "Start Year": number,
        "End Year": number
      }
    ],
    "certifications": [
      {
        "name": string,
        "issuer": string,
        "Issue Date": "YYYY-MM"
      }
    ],
    "projects": [
      {
        "name": string,
        "description": string,
        "technologies": string[],
        "role": string,
        "link": string | null,
        "Start Date": "YYYY-MM",
        "End Date": "YYYY-MM"
      }
    ],
    "availability": {
      "status": "Available" | "Open to Opportunities" | "Not Available",
      "type": "Full-time" | "Part-time" | "Contract",
      "Start Date": "YYYY-MM-DD"
    },
    "socialLinks": {
      "linkedin": string | null,
      "github": string | null,
      "portfolio": string | null
    },
    "matchScore": number (0-100, mandatory, based on JOB CONTEXT),
    "recommendation": "Highly Recommended" | "Recommended" | "Consider" | "Not Recommended",
    "strengths": string[],
    "gaps": string[],
    "aiSummary": string
  }

  ${jobBlock}
  
  RESUME TEXT:
  ${resumeText}
  `;

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    const model = client.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) {
          throw new Error(`Model ${modelName} returned empty response`);
        }
        return text;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttemptsPerModel) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate JSON from resume text");
}
