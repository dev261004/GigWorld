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
    source_website: {
      type: String,
      default: "unknown",
    },
    source_url: {
      type: String,
    },
    external_id: {
      type: String,
    },
    project_status: {
      type: String,
    },
    budget: {
      raw: { type: String },
      currency: { type: String },
      min: { type: Number },
      max: { type: Number },
      is_hourly: { type: Boolean },
    },
    bids_count: {
      type: Number,
    },
    scraped_at: {
      type: Date,
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

jobSchema.index({ source_website: 1, external_id: 1 });

export const Job = mongoose.model("Job", jobSchema);
