import { Router } from "express";
import {
  createJob,
  getJobs,
  getJobById,
  setJobStatus,
  deleteJob,
} from "../controllers/jobController.ts";

const router = Router();

// List all jobs (optionally filter by ?status=open|closed)
router.get("/", getJobs);

// Create a new job
router.post("/", createJob);

// Get a single job by ID
router.get("/:id", getJobById);

// Open or close a job
router.patch("/:id/status", setJobStatus);

// Delete a job
router.delete("/:id", deleteJob);

export default router;
