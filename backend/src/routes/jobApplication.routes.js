import { Router } from "express";
import multer, { diskStorage } from "multer";
import { extname } from "path";
import { applyJob } from "../controllers/jobApplication.controller.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

// Multer configuration for resume upload
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/resumes");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST route to apply for the job
router.post("/apply/:jobId",  verifyJWT,upload.single("resume"),applyJob);

export default router;
