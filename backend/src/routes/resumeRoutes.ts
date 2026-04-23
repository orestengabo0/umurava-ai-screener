import { Router } from "express";
import multer from "multer";
import {
  ingestResumesExtractText,
  ingestResumesProcess,
  ingestResumesParseWithGemini,
} from "../controllers/resumeController.ts";

const router = Router();

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

export default router;
