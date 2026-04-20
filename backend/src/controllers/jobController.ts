import type { Request, Response, NextFunction } from "express";
import { JobModel } from "../models/Job.ts";
import type { ExperienceLevel } from "../models/Job.ts";

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
export async function createJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description, requiredSkills, experienceLevel, location } =
      req.body as {
        title?: string;
        description?: string;
        requiredSkills?: string[];
        experienceLevel?: ExperienceLevel;
        location?: string;
      };

    if (!title || !description) {
      res.status(400).json({ message: "title and description are required" });
      return;
    }

    const jobData: Record<string, any> = {
      title,
      description,
      requiredSkills: requiredSkills ?? [],
    };
    if (experienceLevel) jobData.experienceLevel = experienceLevel;
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
    const { status } = req.query as { status?: string };

    const filter: Record<string, unknown> = {};
    if (status === "open" || status === "closed") {
      filter["status"] = status;
    }

    const jobs = await JobModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json(jobs);
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
    const job = await JobModel.findById(req.params["id"]).lean();
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
    const { status } = req.body as { status?: "open" | "closed" };
    if (status !== "open" && status !== "closed") {
      res
        .status(400)
        .json({ message: "status must be 'open' or 'closed'" });
      return;
    }

    const job = await JobModel.findByIdAndUpdate(
      req.params["id"],
      { status },
      { new: true, runValidators: true }
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
    const job = await JobModel.findByIdAndDelete(req.params["id"]).lean();
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
