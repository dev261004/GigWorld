// models/JobApplication.js
import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  status: { type: String, enum: ["Applied", "Interview", "Rejected", "Accepted"], default: "Applied" },
  appliedAt: { type: Date, default: Date.now },
});

export const jobApplicationStatus = mongoose.model("jobApplicationStatus", jobApplicationSchema);
