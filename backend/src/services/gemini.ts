import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }

  return cachedClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("503") ||
    message.includes("429") ||
    message.toLowerCase().includes("service unavailable") ||
    message.toLowerCase().includes("high demand") ||
    message.toLowerCase().includes("rate")
  );
}

export async function generateJsonFromResumeText(params: {
  resumeText: string;
  jobContext?: {
    title: string;
    description: string;
    requiredSkills: string[];
    requirements: string[];
    experienceLevel: string;
    minExperience: number;
    employmentType: string;
    location?: string;
    educationLevel?: string;
  };
}): Promise<string> {
  const { resumeText, jobContext } = params;

  const preferredModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = [
    preferredModel && preferredModel.length > 0
      ? preferredModel
      : "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemini-2.0-flash",
  ];

  const maxAttemptsPerModel = Number(process.env.GEMINI_MAX_RETRIES ?? 2);
  const baseDelayMs = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 400);

  const jobBlock = jobContext
    ? `JOB CONTEXT (for disambiguation only; do NOT invent data that is not in the resume):\n${JSON.stringify(
        jobContext
      )}`
    : "";

  const prompt = `You are an information extraction system.

TASK:
Extract applicant information from the RESUME TEXT and output a single JSON object matching the schema below.

STRICT OUTPUT RULES:
- Output ONLY raw JSON (no markdown, no code fences, no comments).
- Use double quotes for all keys and string values.
- If a field is unknown, use null (for nullable scalars) or an empty array (for list fields).
- Do NOT fabricate emails, phone numbers, companies, dates, degrees, or links.
- Ensure arrays contain unique items where appropriate (e.g., skills).

SCHEMA (TypeScript-like, but output must be JSON):
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "headline": string | null,
  "bio": string | null,
  "location": string | null,
  "phone": string | null,
  "skills": Array<{ "name": string, "level": "Beginner"|"Intermediate"|"Advanced"|"Expert", "yearsOfExperience": number | null }>,
  "languages": Array<{ "name": string, "proficiency": "Basic"|"Conversational"|"Fluent"|"Native" }> ,
  "experience": Array<{ "company": string, "role": string, "startDate": string, "endDate": string, "description": string | null, "technologies": string[], "isCurrent": boolean | null }>,
  "education": Array<{ "institution": string, "degree": string, "fieldOfStudy": string, "startYear": number, "endYear": number }>,
  "certifications": Array<{ "name": string, "issuer": string, "issueDate": string | null }>,
  "projects": Array<{ "name": string, "description": string | null, "technologies": string[], "role": string | null, "link": string | null, "startDate": string | null, "endDate": string | null }>,
  "availability": { "status": "Available"|"Open to Opportunities"|"Not Available", "type": "Full-time"|"Part-time"|"Contract", "startDate": string | null },
  "socialLinks": { "linkedin": string | null, "github": string | null, "portfolio": string | null, "twitter": string | null }
}

NOTES:
- Dates: keep as strings exactly as found. If missing, use empty string for required date strings in experience.
- availability: if not found, default to {"status":"Available","type":"Full-time","startDate":null}.

${jobBlock}

RESUME TEXT:
${resumeText}
`;

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    const model = getGeminiClient().getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;

        if (!isRetryableGeminiError(err) || attempt === maxAttemptsPerModel) {
          break;
        }

        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed");
}
