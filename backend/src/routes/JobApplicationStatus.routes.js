// routes/jobApplicationRoutes.js
import { Router } from "express";
import {
  deleteTrackedApplication,
  getTrackedJob,
  getUserJobApplications,
  trackJobApplication,
  updateTrackedApplication,
} from "../controllers/JobApplicationStatus.controller.js";
import { verifyJWT } from "../middlewares/auth.js"; // Assuming you have an auth middleware for protecting routes

const router = Router();

router.get("/status", verifyJWT, getUserJobApplications);
router.get("/job/:jobId", verifyJWT, getTrackedJob);
router.post("/track/:jobId", verifyJWT, trackJobApplication);
router.patch("/:trackingId", verifyJWT, updateTrackedApplication);
router.delete("/:trackingId", verifyJWT, deleteTrackedApplication);

export default router;
