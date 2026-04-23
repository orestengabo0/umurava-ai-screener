import mongoose, { Schema, Types } from "mongoose";

export interface ResumeFile {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  applicantId: Types.ObjectId;

  cloudinaryPublicId: string;
  cloudinaryUrl: string;

  originalName: string;
  mimeType: string;
  size: number;
  extractedText?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ResumeFileSchema = new Schema<ResumeFile>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    extractedText: String,
  },
  {
    timestamps: true,
  }
);

export const ResumeFileModel =
  (mongoose.models["ResumeFile"] as mongoose.Model<ResumeFile>) ??
  mongoose.model("ResumeFile", ResumeFileSchema);
