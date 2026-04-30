import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Applicant } from "../models/Applicant.js";
import { ResumeFileModel } from "../models/ResumeFile.js";
import { deleteRawAsset } from "../services/cloudinary.js";
import { getGeminiClientForUser } from "../services/gemini.js";

export const uploadApplicants = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { jobId } = req.body;
    const fileType =
      req.file.mimetype === "application/pdf"
        ? "pdf"
        : req.file.originalname.endsWith(".csv")
          ? "csv"
          : "xlsx";

    // Store file metadata and validate
    const file = {
      id: Date.now(),
      name: req.file.originalname,
      size: req.file.size,
      type: fileType,
      status: "valid" as const,
      rows:
        fileType !== "pdf" ? Math.floor(Math.random() * 200 + 10) : undefined,
    };

    // For now, we're just storing the file info
    // In production, you'd parse the file and extract applicant data
    const applicant = new Applicant({
      firstName: "Sample",
      lastName: "Applicant",
      email: `applicant-${Date.now()}@example.com`,
      skills: [],
      experience: [],
      education: [],
      projects: [],
      availability: {
        status: "Available",
        type: "Full-time",
      },
      jobId,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      fileType,
      fileName: req.file.originalname,
    });

    await applicant.save();

    res.status(200).json({
      message: "File uploaded successfully",
      file,
      applicantId: applicant._id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({ message });
  }
};

export const getApplicants = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.query;
    const query = jobId ? { jobId, uploadedBy: req.user.userId } : { uploadedBy: req.user.userId };

    const applicants = await Applicant.find(query).sort({ uploadedAt: -1 });

    res.status(200).json({
      message: "Applicants retrieved successfully",
      data: applicants,
      count: applicants.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    res.status(500).json({ message });
  }
};

export const getApplicantById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ message: "Applicant id is required" });
    }

    const applicant = await Applicant.findOne({
      _id: id,
      uploadedBy: req.user.userId,
    }).lean();

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const resumeFile = await ResumeFileModel.findOne({ applicantId: id }).lean();

    res.status(200).json({
      message: "Applicant retrieved successfully",
      data: {
        ...applicant,
        resumeFile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    res.status(500).json({ message });
  }
};

export const deleteApplicant = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ message: "Applicant id is required" });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid applicant id" });
    }

    const applicantObjectId = new Types.ObjectId(id);

    const applicant = await Applicant.findOne({
      _id: id,
      uploadedBy: req.user.userId,
    });

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const resumeFiles = await ResumeFileModel.find({
      applicantId: applicantObjectId,
    }).lean();

    await Applicant.findByIdAndDelete(id);
    await ResumeFileModel.deleteMany({ applicantId: applicantObjectId });

    await Promise.allSettled(
      resumeFiles.map((rf) => deleteRawAsset(rf.cloudinaryPublicId))
    );

    res.status(200).json({
      message: "Applicant deleted successfully",
      data: applicant,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    res.status(500).json({ message });
  }
};
export const chatWithApplicant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, history } = req.body;
    const userId = (req as any).user?.userId;

    if (!id || !message) {
      return res.status(400).json({ message: "Applicant ID and message are required" });
    }

    const applicant = await Applicant.findById(id).lean();
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const resumeFile = await ResumeFileModel.findOne({ applicantId: id }).lean();
    const resumeText = resumeFile?.extractedText || "";

    const { JobModel } = await import("../models/Job.js");
    const job = await JobModel.findById(applicant.jobId).lean();

    const context = `
      You are an AI assistant helping a recruiter analyze a candidate for a job.
      
      JOB CONTEXT:
      Title: ${job?.title}
      Description: ${job?.description}
      Requirements: ${job?.requirements?.join(", ")}

      CANDIDATE INFO:
      ${JSON.stringify(applicant)}
      
      FULL RESUME TEXT:
      ${resumeText}
      
      User Message: ${message}
      
      RULES:
      - Be professional and objective.
      - Base your answers on the candidate's data, resume text, and how they fit the specific job.
      - If you don't know, say so.
    `;

    const { client, model } = await getGeminiClientForUser(userId || "");
    const generativeModel = client.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(context);
    const response = result.response.text();

    res.status(200).json({ response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "chat failed. Please check if your gemini key is valid and not expired";
    res.status(500).json({ message });
  }
};

export const deleteJobApplicants = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const applicants = await Applicant.find({
      jobId,
      uploadedBy: req.user.userId,
    }).lean();
    const applicantIds = applicants.map(a => a._id);

    const resumeFiles = await ResumeFileModel.find({
      applicantId: { $in: applicantIds },
    }).lean();

    // Delete from Cloudinary
    await Promise.allSettled(
      resumeFiles.map((rf) => deleteRawAsset(rf.cloudinaryPublicId))
    );

    // Delete from DB
    await ResumeFileModel.deleteMany({ applicantId: { $in: applicantIds } });
    await Applicant.deleteMany({ jobId, uploadedBy: req.user.userId });

    res.status(200).json({
      message: "All applicants for the job deleted successfully",
      count: applicants.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    res.status(500).json({ message });
  }
};
