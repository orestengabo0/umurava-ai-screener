import mongoose, { Schema, Document } from "mongoose";

interface IApplicant extends Document {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  skills: {
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    yearsOfExperience?: number;
  }[];
  languages?: {
    name: string;
    proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
  }[];
  experience: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description?: string;
    technologies?: string[];
    isCurrent?: boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    issueDate?: string;
  }[];
  projects: {
    name: string;
    description?: string;
    technologies?: string[];
    role?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
  }[];
  availability: {
    status: "Available" | "Open to Opportunities" | "Not Available";
    type: "Full-time" | "Part-time" | "Contract";
    startDate?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
  jobId?: string;
  uploadedBy?: string;
  uploadedAt: Date;
  fileType: "pdf" | "csv" | "xlsx";
  fileName: string;
}

const applicantSchema = new Schema<IApplicant>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  headline: String,
  bio: String,
  location: String,
  phone: String,
  skills: [
    {
      name: { type: String, required: true },
      level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        default: "Intermediate",
      },
      yearsOfExperience: Number,
    },
  ],
  languages: [
    {
      name: String,
      proficiency: {
        type: String,
        enum: ["Basic", "Conversational", "Fluent", "Native"],
      },
    },
  ],
  experience: [
    {
      company: { type: String, required: true },
      role: { type: String, required: true },
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      description: String,
      technologies: [String],
      isCurrent: Boolean,
    },
  ],
  education: [
    {
      institution: { type: String, required: true },
      degree: { type: String, required: true },
      fieldOfStudy: { type: String, required: true },
      startYear: { type: Number, required: true },
      endYear: { type: Number, required: true },
    },
  ],
  certifications: [
    {
      name: String,
      issuer: String,
      issueDate: String,
    },
  ],
  projects: [
    {
      name: { type: String, required: true },
      description: String,
      technologies: [String],
      role: String,
      link: String,
      startDate: String,
      endDate: String,
    },
  ],
  availability: {
    status: {
      type: String,
      enum: ["Available", "Open to Opportunities", "Not Available"],
      required: true,
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract"],
      required: true,
    },
    startDate: String,
  },
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
  },
  jobId: String,
  uploadedBy: String,
  uploadedAt: { type: Date, default: Date.now },
  fileType: {
    type: String,
    enum: ["pdf", "csv", "xlsx"],
    required: true,
  },
  fileName: { type: String, required: true },
});

applicantSchema.index(
  { jobId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      jobId: { $type: "string" },
      email: { $type: "string" },
    },
  }
);

export const Applicant = mongoose.model<IApplicant>(
  "Applicant",
  applicantSchema,
);
