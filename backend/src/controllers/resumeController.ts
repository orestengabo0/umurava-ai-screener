import type { Request, Response, NextFunction } from "express";
import pLimit from "p-limit";
import { PDFParse} from "pdf-parse";
import { JobModel } from "../models/Job.ts";
import { applicantParseSchema } from "../services/applicantParseSchema.ts";
import { generateJsonFromResumeText } from "../services/gemini.ts";

const MIN_EXTRACTED_TEXT_LENGTH = 300;
const EXTRACT_CONCURRENCY = 4;
const AI_CONCURRENCY = 3;

function extractFirstJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return text.slice(start, end + 1);
}

export async function ingestResumesExtractText(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params as { jobId: string };

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!jobId) {
      res.status(400).json({ message: "jobId is required" });
      return;
    }

    if (files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const limit = pLimit(EXTRACT_CONCURRENCY);

    const settled = await Promise.allSettled(
      files.map((file) =>
        limit(async () => {
          const parsed = await( new PDFParse(file.buffer)).getText();
          const text = (parsed.text ?? "").trim();
          const textLength = text.length;

          if (textLength < MIN_EXTRACTED_TEXT_LENGTH) {
            return {
              ok: false as const,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              textLength,
              reason:
                "No extractable text detected (likely scanned image). Please upload a text-based PDF.",
            };
          }

          return {
            ok: true as const,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            textLength,
          };
        })
      )
    );

    const results = settled.map((r) => {
      if (r.status === "fulfilled") return r.value;
      return {
        ok: false as const,
        originalName: "unknown",
        size: 0,
        mimeType: "application/pdf",
        textLength: 0,
        reason: r.reason instanceof Error ? r.reason.message : "Extraction failed",
      };
    });

    const summary = {
      total: results.length,
      accepted: results.filter((r) => r.ok).length,
      rejected: results.filter((r) => !r.ok).length,
    };

    res.status(200).json({ jobId, summary, results });
  } catch (err) {
    next(err);
  }
}

export async function ingestResumesParseWithGemini(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params as { jobId: string };
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (!jobId) {
      res.status(400).json({ message: "jobId is required" });
      return;
    }

    if (files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const job = await JobModel.findById(jobId).lean();
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const extractLimit = pLimit(EXTRACT_CONCURRENCY);
    const aiLimit = pLimit(AI_CONCURRENCY);

    const settled = await Promise.allSettled(
      files.map((file) =>
        extractLimit(async () => {
          const parsed = await( new PDFParse(file.buffer)).getText();
          const resumeText = (parsed.text ?? "").trim();
          const textLength = resumeText.length;

          if (textLength < MIN_EXTRACTED_TEXT_LENGTH) {
            return {
              ok: false as const,
              stage: "extract" as const,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              textLength,
              reason:
                "No extractable text detected (likely scanned image). Please upload a text-based PDF.",
            };
          }

          const modelText = await aiLimit(() =>
            generateJsonFromResumeText({
              resumeText,
              jobContext: {
                title: job.title,
                description: job.description,
                requiredSkills: job.requiredSkills,
                requirements: job.requirements,
                experienceLevel: job.experienceLevel,
                minExperience: job.minExperience,
                employmentType: job.employmentType,
                ...(job.location !== undefined ? { location: job.location } : {}),
                ...(job.educationLevel !== undefined
                  ? { educationLevel: job.educationLevel }
                  : {}),
              },
            })
          );

          const jsonText = extractFirstJsonObject(modelText);
          const json = JSON.parse(jsonText) as unknown;
          const validated = applicantParseSchema.safeParse(json);

          if (!validated.success) {
            return {
              ok: false as const,
              stage: "validate" as const,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              textLength,
              reason: "AI output failed schema validation",
              issues: validated.error.issues,
            };
          }

          return {
            ok: true as const,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            textLength,
            applicant: validated.data,
          };
        })
      )
    );

    const results = settled.map((r) => {
      if (r.status === "fulfilled") return r.value;
      return {
        ok: false as const,
        stage: "unknown" as const,
        originalName: "unknown",
        size: 0,
        mimeType: "application/pdf",
        textLength: 0,
        reason: r.reason instanceof Error ? r.reason.message : "Processing failed",
      };
    });

    const summary = {
      total: results.length,
      parsed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    };

    res.status(200).json({ jobId, summary, results });
  } catch (err) {
    next(err);
  }
}
