import mongoose, { Schema, model, Types } from "mongoose";

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship";

export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

export type EducationLevel = "any" | "bachelors" | "masters" | "phd";

export type JobStatus = "open" | "closed";

export interface Job {
  _id: Types.ObjectId;

  title: string;
  department?: string;
  description: string;

  employmentType: EmploymentType;

  requirements: string[];

  // Free-form skills: allow custom entries (no enum)
  requiredSkills: string[];

  niceToHaveSkills?: string[];

  experienceLevel: ExperienceLevel;
  minExperience: number;
  educationLevel?: EducationLevel;
  location?: string;

  status: JobStatus; // open by default

  createdBy?: Types.ObjectId; // optional: if you want ownership
  createdAt: Date;
  updatedAt: Date;
}

function normalizeStringArray(values: string[]) {
  return Array.isArray(values)
    ? Array.from(
      new Set(
        values
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter((s) => s.length > 0)
      )
    )
    : [];
}

const JobSchema = new Schema<Job>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      required: false,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      required: true,
      index: true,
    },

    requirements: {
      type: [String],
      required: true,
      validate: {
        validator: (reqs: string[]) =>
          Array.isArray(reqs) &&
          reqs.length > 0 &&
          reqs.every(
            (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 300
          ),
        message:
          "Requirements must be a non-empty array of non-empty strings (max length 300).",
      },
      set: normalizeStringArray,
    },

    requiredSkills: {
      type: [String],
      required: false,
      default: [],
      validate: {
        validator: (skills: string[]) =>
          Array.isArray(skills) &&
          skills.every(
            (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 150
          ),
        message: "Each skill must be a non-empty string with max length 150.",
      },
      set: normalizeStringArray,
    },

    niceToHaveSkills: {
      type: [String],
      required: false,
      default: [],
      validate: {
        validator: (skills: string[]) =>
          Array.isArray(skills) &&
          skills.every(
            (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 150
          ),
        message: "Each nice-to-have skill must be a non-empty string (max length 150).",
      },
      set: normalizeStringArray,
    },

    experienceLevel: {
      type: String,
      enum: ["junior", "mid", "senior", "lead"],
      required: true,
      index: true,
    },

    minExperience: {
      type: Number,
      required: true,
      min: 0,
    },

    educationLevel: {
      type: String,
      enum: ["any", "bachelors", "masters", "phd"],
      required: false,
      default: "any",
    },

    location: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobModel =
  (mongoose.models["Job"] as mongoose.Model<Job>) ??
  model("Job", JobSchema);