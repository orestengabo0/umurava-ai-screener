import { Router } from "express";
import multer from "multer";
import {
  ingestResumesExtractText,
  ingestResumesProcess,
  ingestResumesParseWithGemini,
} from "../controllers/resumeController.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();

// All resume routes require authentication
router.use(authenticateToken);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["application/pdf"];
    const allowedExt = [".pdf"];
    const ext = "." + (file.originalname.split(".").pop() ?? "").toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF files are allowed."));
    }
  },
});

router.post("/jobs/:jobId/resumes/ingest", upload.array("files", 50), ingestResumesExtractText);

router.post(
  "/jobs/:jobId/resumes/parse",
  upload.array("files", 50),
  ingestResumesParseWithGemini
);

router.post(
  "/jobs/:jobId/resumes/process",
  upload.array("files", 50),
  ingestResumesProcess
);

router.post("/jobs/:jobId/chat-results", async (req: any, res: any) => {
  try {
    const { jobId } = req.params;
    const { message, context } = req.body;
    const userId = req.user?.userId;
    const { getGeminiClientForUser } = await import("../services/gemini.ts");
    const { JobModel } = await import("../models/Job.ts");

    const job = await JobModel.findById(jobId).lean();
    
    const { client, model } = await getGeminiClientForUser(userId || "");
    const generativeModel = client.getGenerativeModel({ model });
    const prompt = `You are a recruiter analyzing candidates for the following job:
    JOB TITLE: ${job?.title}
    JOB DESCRIPTION: ${job?.description}
    JOB REQUIREMENTS: ${job?.requirements?.join(", ")}
    
    CANDIDATES DATA: ${JSON.stringify(context)}
    
    User Question: ${message}`;
    
    const result = await generativeModel.generateContent(prompt);
    res.status(200).json({ response: result.response.text() });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
