import { submitContactForm } from '../controllers/contact.controller.js';
import { Router } from "express";
const router = Router();


// POST request to handle contact form submission
router.post('/submit', submitContactForm);

export default router;
