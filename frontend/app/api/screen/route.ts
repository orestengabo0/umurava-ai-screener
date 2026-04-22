import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function extractJson(raw: string): string {
  // Strip markdown fences
  let text = raw.trim();
  if (text.startsWith("```json")) text = text.slice(7).trim();
  if (text.startsWith("```")) text = text.slice(3).trim();
  if (text.endsWith("```")) text = text.slice(0, -3).trim();

  // Try to find a JSON array anywhere in the response
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    return text.slice(arrStart, arrEnd + 1);
  }

  return text;
}

export async function POST(req: Request) {
  try {
    const { jobDetails, applicantsText } = await req.json();

    if (!applicantsText || applicantsText.trim().length < 5) {
      return NextResponse.json(
        { error: "No applicant data provided. Please upload files first." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a senior AI Recruitment Analyst. You must analyze the candidate data below and return a JSON screening result.

CRITICAL: Your entire response must be a valid JSON array ONLY. No apologies, no explanations, no markdown. Just the JSON array.
If you cannot find any candidates, return an empty array: []

## Job Requirements
${jobDetails}

## Candidate Data (from uploaded files)
${applicantsText}

## Your Task
1. Identify every distinct candidate in the data above
2. Score each 0-100 based on match to job requirements:
   - Skills match: 35%
   - Experience relevance: 30%
   - Education: 15%
   - Projects/Achievements: 20%
3. Sort by score descending

## Required JSON Schema (return array of these objects)
[
  {
    "id": 1,
    "name": "Full Name (or 'Candidate 1' if unknown)",
    "role": "their current or best-fit role title",
    "score": 85,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1", "gap 2"],
    "recommendation": "Highly Recommended",
    "experience": "5 years",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "aiSummary": "2-3 sentences explaining this candidate's ranking and hiring recommendation."
  }
]

recommendation must be exactly one of: "Highly Recommended", "Recommended", "Consider", "Not Recommended"
score >= 80 → Highly Recommended, 65-79 → Recommended, 50-64 → Consider, <50 → Not Recommended

Return ONLY the JSON array. Nothing else.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    console.log("[screen] raw Gemini response (first 500 chars):", raw.slice(0, 500));

    const cleaned = extractJson(raw);
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("AI returned a non-array response");
    }

    const sorted = parsed.sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score
    );

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("[screen] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "AI screening failed: " + message },
      { status: 500 }
    );
  }
}
