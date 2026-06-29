import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../db/db.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/jobs.model.js";

// Load env vars
dotenv.config({ path: ".env" });

const dummyUsers = [
  {
    username: "testuser1",
    email: "test1@example.com",
    fullName: "Test User One",
    password: "password123",
    role: "freelancer",
    isVerified: true,
  },
  {
    username: "testcompany1",
    email: "company1@example.com",
    fullName: "Tech Company Inc",
    password: "password123",
    role: "company",
    isVerified: true,
  }
];

const dummyJobs = [
  {
    job_title: "React Frontend Developer Needed",
    company_name: "Tech Company Inc",
    experience: "Intermediate",
    location: "Remote",
    min_requirements: "3+ years of React experience",
    tech_stack: ["React", "JavaScript", "Tailwind CSS"],
    source: "company",
    budget: { min: 3000, max: 5000, currency: "USD", is_hourly: false },
    is_active: true,
  },
  {
    job_title: "Backend Node.js Engineer",
    company_name: "Startup XYZ",
    experience: "Senior",
    location: "Remote",
    min_requirements: "5+ years Node.js, MongoDB",
    tech_stack: ["Node.js", "Express", "MongoDB"],
    source: "scraped",
    source_website: "freelancer.com",
    budget: { min: 50, max: 80, currency: "USD", is_hourly: true },
    is_active: true,
  },
  {
    job_title: "Full Stack Developer",
    company_name: "Global Corp",
    experience: "Expert",
    location: "New York (Hybrid)",
    min_requirements: "Full stack experience, AWS",
    tech_stack: ["React", "Node.js", "AWS", "Python"],
    source: "scraped",
    source_website: "upwork",
    budget: { min: 8000, max: 12000, currency: "USD", is_hourly: false },
    is_active: true,
  }
];

const seedData = async () => {
  try {
    await connectDB();
    console.log("Connected to DB, inserting dummy data...");

    // Insert Users
    for (const u of dummyUsers) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        await User.create(u);
        console.log(`Created user: ${u.username}`);
      } else {
        console.log(`User ${u.username} already exists`);
      }
    }

    // Insert Jobs
    await Job.insertMany(dummyJobs);
    console.log(`Inserted ${dummyJobs.length} dummy jobs`);

    console.log("Data seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
