// routes/project.js
import { Router } from "express";
import { createProject, getFreelancerProjects, deleteProject } from '../controllers/project.controller.js';
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

// Create a project
router.post('/create', verifyJWT, createProject);

// Get all projects for a freelancer
router.get('/freelancer', verifyJWT, getFreelancerProjects);

// Delete a project
router.delete('/:projectId', verifyJWT, deleteProject);

export default router;
