import { NextResponse } from "next/server";
import { getToken } from "@/lib/api/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    const response = await fetch(`${API_BASE}/screen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobDetails, applicantsText }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Check for quota exceeded error
      if (response.status === 429 || error.message?.toLowerCase().includes("quota") || error.message?.toLowerCase().includes("limit")) {
        return NextResponse.json(
          { 
            error: "API quota exceeded",
            quotaExceeded: true,
            message: error.message || "You have reached your Gemini API quota limit. Please update your API key in Settings."
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || "Screening failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[screen] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "AI screening failed: " + message },
      { status: 500 }
    );
  }
}
