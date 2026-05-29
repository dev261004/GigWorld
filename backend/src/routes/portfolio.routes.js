// routes/portfolio.js
import { Router } from "express";
const router = Router();
import {
  createPortfolio,
  generateResume,
  getMyPortfolio,
  getPortfolio,
  resumeUpload,
  saveMyPortfolio,
  updatePortfolio,
  uploadResume
} from '../controllers/portfolio.controller.js';
import { verifyJWT } from '../middlewares/auth.js';

router.get('/me', verifyJWT, getMyPortfolio);
router.put('/me', verifyJWT, saveMyPortfolio);
router.post('/resume/upload', verifyJWT, resumeUpload.single("resume"), uploadResume);
router.post('/resume/generate', verifyJWT, generateResume);

// Create a portfolio
router.post('/create', verifyJWT, createPortfolio);

// Get a user's portfolio
router.get('/:userId', getPortfolio);

// Update portfolio
router.put('/update', verifyJWT, updatePortfolio);

export default router;
