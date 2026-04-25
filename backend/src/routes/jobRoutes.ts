import { Router } from "express";
import {
  createJob,
  getJobs,
  getJobById,
  setJobStatus,
  deleteJob,
  updateJob,
} from "../controllers/jobController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All job routes require authentication
router.use(authenticateToken);

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

// Update a job
router.put("/:id", updateJob);

export default router;
