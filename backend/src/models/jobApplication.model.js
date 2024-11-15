import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  resume: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
});

export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

