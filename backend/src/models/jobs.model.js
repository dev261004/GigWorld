import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema(
  {
    job_title: {
      type: String,
      required: true,
    },
    company_name: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      default: "None",
    },
    experience: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    min_requirements: {
      type: String,
      required: true,
    },
    tech_stack: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ["scraped", "company"],
      default: "scraped",
    },
    companyDetails: {
      description: { type: String },
      website: { type: String },
      contactEmail: { type: String },
    },
    application_deadline: { type: Date }, 
    salary_range: {
      min: { type: Number }, 
      max: { type: Number }, 
    },
    postedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
  }
);

export const Job = mongoose.model("Job", jobSchema);
