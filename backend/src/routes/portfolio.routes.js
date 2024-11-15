// routes/portfolio.js
import { Router } from "express";
const router = Router();
import { createPortfolio, getPortfolio, updatePortfolio } from '../controllers/portfolio.controller.js';
import { verifyJWT } from '../middlewares/auth.js';

// Create a portfolio
router.post('/create', verifyJWT, createPortfolio);

// Get a user's portfolio
router.get('/:userId', getPortfolio);

// Update portfolio
router.put('/update', verifyJWT, updatePortfolio);

export default router;
