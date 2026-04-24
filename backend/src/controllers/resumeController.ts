import type { Request, Response, NextFunction } from "express";
import pLimit from "p-limit";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { JobModel } from "../models/Job.js";
import { Applicant } from "../models/Applicant.js";
import { ResumeFileModel } from "../models/ResumeFile.js";
import { applicantParseSchema } from "../services/applicantParseSchema.js";
import { generateJsonFromResumeText } from "../services/gemini.js";
import { uploadPdfBuffer } from "../services/cloudinary.js";

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
              userId: (req as any).user?.userId,
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

          const parsedApplicant = validated.data;
 
           if (!parsedApplicant.isResume) {
             return {
               ok: false as const,
               stage: "validate" as const,
               originalName: file.originalname,
               size: file.size,
               mimeType: file.mimetype,
               textLength,
               reason: "File skipped: This does not appear to be a resume.",
             };
           }
 
           return await persistLimit(async () => {

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
                  matchScore: parsedApplicant.matchScore,
                  recommendation: parsedApplicant.recommendation,
                  strengths: parsedApplicant.strengths,
                  gaps: parsedApplicant.gaps,
                  aiSummary: parsedApplicant.aiSummary,
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
              extractedText: resumeText,
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

          const modelText = await aiLimit(async () => {
            try {
              return await generateJsonFromResumeText({
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
                userId: (req as any).user?.userId,
              });
            } catch (aiError) {
              const errorMessage = aiError instanceof Error ? aiError.message : 'AI processing failed';
              
              // Check for quota exceeded error
              if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
                throw new Error('API quota exceeded. Please update your API key or switch to a different model in Settings.');
              }
              
              throw aiError;
            }
          });

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

// ─── POST /api/jobs/:jobId/resumes/process-csv ─────────────────────────────
export async function ingestResumesFromCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params as { jobId: string };
    const userId = (req as any).user?.userId;
    const { candidates } = req.body as { candidates: Array<{ firstName: string; lastName: string; email: string; phone?: string; resumeLink?: string }> };

    if (!candidates || !Array.isArray(candidates)) {
      res.status(400).json({ message: "Candidates array is required" });
      return;
    }

    // Filter candidates with resume links
    const candidatesWithLinks = candidates.filter(c => c.resumeLink && c.resumeLink.trim().length > 0);

    if (candidatesWithLinks.length === 0) {
      res.status(400).json({ message: "No candidates with resume links found" });
      return;
    }

    // Helper function to convert Google Docs URL to export URL
    function convertGoogleDocsUrl(url: string): string {
      if (url.includes('docs.google.com/document')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          return `https://docs.google.com/document/d/${match[1]}/export?format=pdf`;
        }
      }
      return url;
    }

    // Download resumes concurrently with p-limit
    const downloadLimit = pLimit(5); // Download 5 resumes at a time
    const DOWNLOAD_TIMEOUT = 30000; // 30 seconds per download

    const downloadResults = await Promise.allSettled(
      candidatesWithLinks.map((candidate) =>
        downloadLimit(async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

            // Convert Google Docs URL if needed
            const downloadUrl = convertGoogleDocsUrl(candidate.resumeLink!);

            console.log(`[CSV Processing] Downloading resume for ${candidate.email} from: ${downloadUrl}`);

            const response = await fetch(downloadUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            // Validate it's a PDF
            if (!buffer.toString('hex', 0, 4).includes('25504446')) {
              throw new Error('Downloaded file is not a valid PDF');
            }

            console.log(`[CSV Processing] Successfully downloaded resume for ${candidate.email}, size: ${buffer.length} bytes`);

            return {
              success: true,
              candidate,
              buffer,
            };
          } catch (error) {
            console.error(`[CSV Processing] Failed to download resume for ${candidate.email}:`, error);
            return {
              success: false,
              candidate,
              error: error instanceof Error ? error.message : 'Download failed',
            };
          }
        })
      )
    );

    // Separate successful downloads from failures
    const successfulDownloads: Array<{ candidate: any; buffer: Buffer }> = [];
    const failedDownloads: Array<{ candidate: any; error: string }> = [];

    downloadResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success === true && result.value.buffer) {
        successfulDownloads.push({ candidate: result.value.candidate, buffer: result.value.buffer });
      } else if (result.status === 'fulfilled' && result.value.success === false && result.value.error) {
        failedDownloads.push({ candidate: result.value.candidate, error: result.value.error });
      }
    });

    // Process successful downloads through the existing pipeline
    const processLimit = pLimit(3); // Process 3 resumes at a time
    const processResults = await Promise.allSettled(
      successfulDownloads.map(({ candidate, buffer }) =>
        processLimit(async () => {
          try {
            console.log(`[CSV Processing] Processing resume for ${candidate.email}`);
            
            const job = await JobModel.findById(jobId).lean();
            if (!job) {
              throw new Error("Job not found");
            }

            // Extract text from PDF
            console.log(`[CSV Processing] Extracting text from PDF for ${candidate.email}`);
            const extractedText = await extractTextFromPdf(new Uint8Array(buffer));

            if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
              throw new Error("Extracted text too short");
            }

            console.log(`[CSV Processing] Extracted ${extractedText.length} characters from ${candidate.email}'s resume`);

            // Parse with AI
            let parsed: string;
            try {
              console.log(`[CSV Processing] Sending to AI for ${candidate.email}`);
              parsed = await generateJsonFromResumeText({
                resumeText: extractedText,
                jobContext: {
                  title: job.title,
                  description: job.description,
                  requiredSkills: job.requiredSkills || [],
                },
                userId: userId || "",
              });
              console.log(`[CSV Processing] AI parsing complete for ${candidate.email}`);
              console.log(`[CSV Processing] AI output for ${candidate.email}:`, parsed);
            } catch (aiError) {
              const errorMessage = aiError instanceof Error ? aiError.message : 'AI processing failed';
              
              // Check for quota exceeded error
              if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
                throw new Error('API quota exceeded. Please update your API key or switch to a different model in Settings.');
              }
              
              throw aiError;
            }

            // Extract JSON from AI response (may be wrapped in markdown code blocks)
            const jsonText = extractFirstJsonObject(parsed);
            const json = JSON.parse(jsonText) as unknown;

            // Validate schema
            const validated = applicantParseSchema.safeParse(json);

            if (!validated.success) {
              console.error(`[CSV Processing] Schema validation failed for ${candidate.email}:`, validated.error);
              throw new Error("AI output failed schema validation");
            }

            // Check if applicant already exists for this job
            const existingApplicant = await Applicant.findOne({
              jobId,
              email: candidate.email,
            });

            if (existingApplicant) {
              console.log(`[CSV Processing] Applicant ${candidate.email} already exists for this job, skipping`);
              return {
                ok: true,
                candidate: candidate.email,
                applicantId: existingApplicant._id.toString(),
                skipped: true,
              };
            }

            // Create applicant
            console.log(`[CSV Processing] Creating applicant record for ${candidate.email}`);
            const applicant = new Applicant({
              ...validated.data,
              jobId,
              uploadedAt: new Date(),
              fileType: "pdf",
              fileName: `${candidate.firstName}_${candidate.lastName}_resume.pdf`,
              email: candidate.email,
              phone: candidate.phone,
            });

            await applicant.save();
            console.log(`[CSV Processing] Saved applicant ${applicant._id} for ${candidate.email}`);

            // Upload to Cloudinary
            console.log(`[CSV Processing] Uploading to Cloudinary for ${candidate.email}`);
            const cloudinaryResult = await uploadPdfBuffer({
              buffer: buffer,
              folder: jobId,
              filename: `${candidate.firstName}_${candidate.lastName}_resume.pdf`,
            });

            // Save resume file record
            const resumeFile = new ResumeFileModel({
              applicantId: applicant._id,
              cloudinaryPublicId: cloudinaryResult.publicId,
              cloudinaryUrl: cloudinaryResult.url,
              extractedText,
              uploadedAt: new Date(),
              size: buffer.length,
              mimeType: "application/pdf",
              originalName: `${candidate.firstName}_${candidate.lastName}_resume.pdf`,
              jobId,
            });

            await resumeFile.save();
            console.log(`[CSV Processing] Successfully processed ${candidate.email}, applicant ID: ${applicant._id}`);

            return {
              ok: true,
              candidate: candidate.email,
              applicantId: applicant._id.toString(),
            };
          } catch (error) {
            console.error(`[CSV Processing] Failed to process ${candidate.email}:`, error);
            return {
              ok: false,
              candidate: candidate.email,
              error: error instanceof Error ? error.message : 'Processing failed',
            };
          }
        })
      )
    );

    const processedResults: Array<{ ok: boolean; candidate: string; applicantId?: string; error?: string }> = [];

    processResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        processedResults.push(result.value);
      } else {
        processedResults.push({
          ok: false,
          candidate: 'unknown',
          error: result.reason instanceof Error ? result.reason.message : 'Processing failed',
        });
      }
    });

    // Combine results
    const summary = {
      total: candidates.length,
      withLinks: candidatesWithLinks.length,
      downloaded: successfulDownloads.length,
      downloadFailed: failedDownloads.length,
      processed: processedResults.filter(r => r.ok).length,
      processFailed: processedResults.filter(r => !r.ok).length,
    };

    console.log(`[CSV Processing] Summary:`, summary);
    console.log(`[CSV Processing] Downloaded: ${successfulDownloads.map(r => r.candidate.email).join(', ')}`);
    console.log(`[CSV Processing] Download Failed: ${failedDownloads.map(r => `${r.candidate.email} (${r.error})`).join(', ')}`);
    console.log(`[CSV Processing] Processed: ${processedResults.filter(r => r.ok).map(r => r.candidate).join(', ')}`);
    console.log(`[CSV Processing] Process Failed: ${processedResults.filter(r => !r.ok).map(r => `${r.candidate} (${r.error})`).join(', ')}`);

    res.status(200).json({
      success: true,
      summary,
      results: {
        downloaded: successfulDownloads.map(r => r.candidate.email),
        downloadFailed: failedDownloads.map(r => ({ email: r.candidate.email, error: r.error })),
        processed: processedResults.filter(r => r.ok),
        processFailed: processedResults.filter(r => !r.ok),
      },
    });
  } catch (err) {
    next(err);
  }
}