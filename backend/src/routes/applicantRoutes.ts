import { Router } from "express";
import multer from "multer";
import {
  uploadApplicants,
  getApplicants,
  getApplicantById,
  deleteApplicant,
  chatWithApplicant,
  deleteJobApplicants,
} from "../controllers/applicantController.ts";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const allowedExt = [".csv", ".xlsx", ".xls", ".pdf"];
    const ext = "." + (file.originalname.split(".").pop() ?? "").toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, CSV, and XLSX files are allowed.",
        ),
      );
    }
  },
});

// Routes
router.post("/upload", upload.single("file"), uploadApplicants);
router.get("/", getApplicants);
router.get("/:id", getApplicantById);
router.delete("/:id", deleteApplicant);
router.post("/:id/chat", chatWithApplicant);
router.delete("/job/:jobId", deleteJobApplicants);

export default router;
