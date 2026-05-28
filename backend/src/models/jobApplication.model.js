import mongoose, { Schema } from "mongoose";

const applicationStatuses = [
  "Viewed source",
  "Planning to apply",
  "Applied",
  "Interviewing",
  "Rejected",
  "Won",
  "Archived",
];

const jobApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: applicationStatuses,
      default: "Viewed source",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    reminderAt: {
      type: Date,
    },
    sourceWebsite: {
      type: String,
      default: "",
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    sourceOpenedAt: {
      type: Date,
    },
    appliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
jobApplicationSchema.index({ userId: 1, updatedAt: -1 });

export { applicationStatuses };
export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

