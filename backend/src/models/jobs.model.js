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
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    first_seen_at: {
      type: Date,
      default: Date.now,
    },
    last_seen_at: {
      type: Date,
      default: Date.now,
    },
    expired_at: {
      type: Date,
    },
    delete_after: {
      type: Date,
    },
    new_until: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    last_scrape_run_id: {
      type: String,
    },
    expires_at: {
      type: Date,
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
jobSchema.index({ delete_after: 1 }, { expireAfterSeconds: 0 });
jobSchema.index({ is_active: 1, postedAt: -1 });
jobSchema.index({ source_website: 1, last_seen_at: -1 });

export const Job = mongoose.model("Job", jobSchema);
