import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISettings extends Document {
  userId: Types.ObjectId;
  geminiApiKey: string;
  geminiModel: string;
  isActive: boolean;
  lastTestedAt?: Date;
  lastTestSuccess?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    geminiApiKey: {
      type: String,
      required: true,
      trim: true,
    },
    geminiModel: {
      type: String,
      required: true,
      default: "gemini-2.5-flash-lite",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTestedAt: {
      type: Date,
    },
    lastTestSuccess: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel =
  (mongoose.models["Settings"] as mongoose.Model<ISettings>) ??
  mongoose.model<ISettings>("Settings", settingsSchema);
