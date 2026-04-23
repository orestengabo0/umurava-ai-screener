import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Applicant } from "../models/Applicant.ts";
import { ResumeFileModel } from "../models/ResumeFile.ts";
import { deleteRawAsset } from "../services/cloudinary.ts";

export const uploadApplicants = async (req: Request, res: Response) => {
  try {
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
    const { jobId } = req.query;
    const query = jobId ? { jobId } : {};

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
    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ message: "Applicant id is required" });
    }

    const applicant = await Applicant.findById(id);

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    res.status(200).json({
      message: "Applicant retrieved successfully",
      data: applicant,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    res.status(500).json({ message });
  }
};

export const deleteApplicant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ message: "Applicant id is required" });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid applicant id" });
    }

    const applicantObjectId = new Types.ObjectId(id);

    const resumeFiles = await ResumeFileModel.find({
      applicantId: applicantObjectId,
    }).lean();

    const applicant = await Applicant.findByIdAndDelete(id);

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

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
