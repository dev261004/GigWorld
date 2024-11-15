// routes/jobApplicationRoutes.js
import { Router } from "express";
import { getUserJobApplications } from "../controllers/JobApplicationStatus.controller.js";
import { verifyJWT } from "../middlewares/auth.js"; // Assuming you have an auth middleware for protecting routes

const router = Router();

router.get("/status", verifyJWT, getUserJobApplications);

export default router;
