import type { Request, Response, NextFunction } from "express";
import pLimit from "p-limit";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { JobModel } from "../models/Job.ts";
import { Applicant } from "../models/Applicant.ts";
import { ResumeFileModel } from "../models/ResumeFile.ts";
import { applicantParseSchema } from "../services/applicantParseSchema.ts";
import { generateJsonFromResumeText } from "../services/gemini.ts";
import { uploadPdfBuffer } from "../services/cloudinary.ts";

const MIN_EXTRACTED_TEXT_LENGTH = 300;
const EXTRACT_CONCURRENCY = 4;
const AI_CONCURRENCY = 3;
const PERSIST_CONCURRENCY = 4;

async function extractTextFromPdf(buffer: Uint8Array): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n");
}

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
          const text = (await extractTextFromPdf(new Uint8Array(file.buffer))).trim();
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

    const results = settled.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      const file = files[idx];
      return {
        ok: false as const,
        stage: "extract" as const,
        originalName: file?.originalname ?? "unknown",
        size: file?.size ?? 0,
        mimeType: file?.mimetype ?? "application/pdf",
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

export async function ingestResumesProcess(
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
    const persistLimit = pLimit(PERSIST_CONCURRENCY);

    const settled = await Promise.allSettled(
      files.map((file) =>
        extractLimit(async () => {
          const resumeText = (
            await extractTextFromPdf(new Uint8Array(file.buffer))
          ).trim();
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

          return await persistLimit(async () => {
            const parsedApplicant = validated.data;

            const applicantDoc = await Applicant.findOneAndUpdate(
              { jobId, email: parsedApplicant.email },
              {
                $set: {
                  firstName: parsedApplicant.firstName,
                  lastName: parsedApplicant.lastName,
                  email: parsedApplicant.email,
                  headline: parsedApplicant.headline ?? undefined,
                  bio: parsedApplicant.bio ?? undefined,
                  location: parsedApplicant.location ?? undefined,
                  phone: parsedApplicant.phone ?? undefined,
                  skills: parsedApplicant.skills.map((s) => ({
                    name: s.name,
                    level: s.level,
                    ...(s.yearsOfExperience !== null
                      ? { yearsOfExperience: s.yearsOfExperience }
                      : {}),
                  })),
                  languages: parsedApplicant.languages.map((l) => ({
                    name: l.name,
                    proficiency: l.proficiency,
                  })),
                  experience: parsedApplicant.experience.map((e) => ({
                    company: e.company,
                    role: e.role,
                    startDate: e.startDate,
                    endDate: e.endDate,
                    ...(e.description !== null
                      ? { description: e.description }
                      : {}),
                    ...(e.technologies.length > 0
                      ? { technologies: e.technologies }
                      : {}),
                    ...(e.isCurrent !== null ? { isCurrent: e.isCurrent } : {}),
                  })),
                  education: parsedApplicant.education.map((ed) => ({
                    institution: ed.institution,
                    degree: ed.degree,
                    fieldOfStudy: ed.fieldOfStudy,
                    startYear: ed.startYear,
                    endYear: ed.endYear,
                  })),
                  certifications: parsedApplicant.certifications.map((c) => ({
                    name: c.name,
                    issuer: c.issuer,
                    ...(c.issueDate !== null ? { issueDate: c.issueDate } : {}),
                  })),
                  projects: parsedApplicant.projects.map((p) => ({
                    name: p.name,
                    ...(p.description !== null
                      ? { description: p.description }
                      : {}),
                    ...(p.technologies.length > 0
                      ? { technologies: p.technologies }
                      : {}),
                    ...(p.role !== null ? { role: p.role } : {}),
                    ...(p.link !== null ? { link: p.link } : {}),
                    ...(p.startDate !== null ? { startDate: p.startDate } : {}),
                    ...(p.endDate !== null ? { endDate: p.endDate } : {}),
                  })),
                  availability: {
                    status: parsedApplicant.availability.status,
                    type: parsedApplicant.availability.type,
                    ...(parsedApplicant.availability.startDate !== null
                      ? { startDate: parsedApplicant.availability.startDate }
                      : {}),
                  },
                  socialLinks: {
                    ...(parsedApplicant.socialLinks.linkedin !== null
                      ? { linkedin: parsedApplicant.socialLinks.linkedin }
                      : {}),
                    ...(parsedApplicant.socialLinks.github !== null
                      ? { github: parsedApplicant.socialLinks.github }
                      : {}),
                    ...(parsedApplicant.socialLinks.portfolio !== null
                      ? { portfolio: parsedApplicant.socialLinks.portfolio }
                      : {}),
                    ...(parsedApplicant.socialLinks.twitter !== null
                      ? { twitter: parsedApplicant.socialLinks.twitter }
                      : {}),
                  },

                  jobId,
                  uploadedAt: new Date(),
                  fileType: "pdf",
                  fileName: file.originalname,
                },
              },
              {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
              }
            );

            const folder = `umurava/jobs/${jobId}/resumes`;
            const upload = await uploadPdfBuffer({
              buffer: file.buffer,
              folder,
              filename: file.originalname,
            });

            const resumeFile = await ResumeFileModel.create({
              jobId,
              applicantId: applicantDoc._id,
              cloudinaryPublicId: upload.publicId,
              cloudinaryUrl: upload.url,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            });

            return {
              ok: true as const,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              textLength,
              applicantId: applicantDoc._id,
              resumeFileId: resumeFile._id,
              resumeUrl: upload.url,
            };
          });
        })
      )
    );

    const results = settled.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      const file = files[idx];
      return {
        ok: false as const,
        stage: "unknown" as const,
        originalName: file?.originalname ?? "unknown",
        size: file?.size ?? 0,
        mimeType: file?.mimetype ?? "application/pdf",
        textLength: 0,
        reason: r.reason instanceof Error ? r.reason.message : "Processing failed",
      };
    });

    const summary = {
      total: results.length,
      processed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
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
          const resumeText = (await extractTextFromPdf(new Uint8Array(file.buffer))).trim();
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

    const results = settled.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      const file = files[idx];
      return {
        ok: false as const,
        stage: "unknown" as const,
        originalName: file?.originalname ?? "unknown",
        size: file?.size ?? 0,
        mimeType: file?.mimetype ?? "application/pdf",
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