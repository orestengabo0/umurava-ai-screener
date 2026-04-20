import mongoose, { Schema, model, Types } from "mongoose";

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export type JobStatus = "open" | "closed";

export interface Job {
  _id: Types.ObjectId;

  title: string;
  description: string;

  // Free-form skills: allow custom entries (no enum)
  requiredSkills: string[];

  experienceLevel?: ExperienceLevel; // UI currently allows empty selection
  location?: string;

  status: JobStatus; // open by default

  createdBy?: Types.ObjectId; // optional: if you want ownership
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<Job>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills: string[]) =>
          Array.isArray(skills) &&
          skills.every(
            (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 60
          ),
        message: "Each skill must be a non-empty string with max length 60.",
      },
      set: (skills: string[]) =>
        Array.isArray(skills)
          ? Array.from(
              new Set(
                skills
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
              )
            )
          : [],
    },

    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
      required: false,
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