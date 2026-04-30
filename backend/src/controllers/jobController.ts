import type { Request, Response, NextFunction } from "express";
import { JobModel } from "../models/Job.js";
import type { ExperienceLevel } from "../models/Job.js";
import { Applicant } from "../models/Applicant.js";
import { ResumeFileModel } from "../models/ResumeFile.js";

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
export async function createJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { title, description, requiredSkills, experienceLevel, minExperience, employmentType, requirements, location } =
      req.body as {
        title?: string;
        description?: string;
        requiredSkills?: string[];
        experienceLevel?: ExperienceLevel;
        minExperience?: number;
        employmentType?: string;
        requirements?: string[];
        location?: string;
      };

    if (!title || !description) {
      res.status(400).json({ message: "title and description are required" });
      return;
    }

    if (!experienceLevel) {
      res.status(400).json({ message: "experienceLevel is required" });
      return;
    }

    if (minExperience === undefined || minExperience === null) {
      res.status(400).json({ message: "minExperience is required" });
      return;
    }

    if (!employmentType) {
      res.status(400).json({ message: "employmentType is required" });
      return;
    }

    if (!requirements || requirements.length === 0) {
      res.status(400).json({ message: "requirements must be a non-empty array" });
      return;
    }

    const jobData: Record<string, any> = {
      title,
      description,
      requiredSkills: requiredSkills ?? [],
      experienceLevel,
      minExperience,
      employmentType,
      requirements,
      createdBy: req.user.userId,
    };
    if (location) jobData.location = location;

    const job = await JobModel.create(jobData);

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
export async function getJobs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { status, search, page = "1", limit = "10" } = req.query as {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    const p = parseInt(page);
    const l = parseInt(limit);
    const skip = (p - 1) * l;

    const filter: Record<string, any> = {
      createdBy: req.user.userId,
    };
    if (status === "open" || status === "closed") {
      filter["status"] = status;
    }
    if (search) {
      filter["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const total = await JobModel.countDocuments(filter);
    const jobs = await JobModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean();

    res.json({
      jobs,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
export async function getJobById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const job = await JobModel.findOne({
      _id: req.params["id"],
      createdBy: req.user.userId,
    }).lean();
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/jobs/:id/status ───────────────────────────────────────────────
export async function setJobStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { status } = req.body as { status?: "open" | "closed" };
    if (status !== "open" && status !== "closed") {
      res
        .status(400)
        .json({ message: "status must be 'open' or 'closed'" });
      return;
    }

    const job = await JobModel.findOneAndUpdate(
      { _id: req.params["id"], createdBy: req.user.userId },
      { status },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
export async function updateJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { title, description, requiredSkills, experienceLevel, minExperience, employmentType, requirements, location } =
      req.body as {
        title?: string;
        description?: string;
        requiredSkills?: string[];
        experienceLevel?: ExperienceLevel;
        minExperience?: number;
        employmentType?: string;
        requirements?: string[];
        location?: string;
      };

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (requiredSkills) updateData.requiredSkills = requiredSkills;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (minExperience !== undefined) updateData.minExperience = minExperience;
    if (employmentType) updateData.employmentType = employmentType;
    if (requirements) updateData.requirements = requirements;
    if (location !== undefined) updateData.location = location;

    const job = await JobModel.findOneAndUpdate(
      { _id: req.params["id"], createdBy: req.user.userId },
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
export async function deleteJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const jobId = req.params["id"];
    const job = await JobModel.findOneAndDelete({
      _id: jobId,
      createdBy: req.user.userId,
    }).lean();

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    // Cascade delete: remove all applicants associated with this job
    await Applicant.deleteMany({ jobId });

    // Cascade delete: remove all resume files associated with this job
    await ResumeFileModel.deleteMany({ jobId });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
