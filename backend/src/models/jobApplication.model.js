import mongoose,{ Schema } from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  resume: { type: String, required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  appliedAt: { type: Date, default: Date.now },
});

export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

