// routes/project.js
import { Router } from "express";
import { createProject, getFreelancerProjects, updateProject, deleteProject } from '../controllers/project.controller.js';
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

// Create a project
router.post('/create', verifyJWT, createProject);

// Get all projects for a freelancer
router.get('/freelancer', verifyJWT, getFreelancerProjects);

// Update a project
router.put('/:projectId', verifyJWT, updateProject);

// Delete a project
router.delete('/:projectId', verifyJWT, deleteProject);

export default router;
