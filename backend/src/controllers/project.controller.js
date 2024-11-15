// controllers/projectController.js
import {Project} from '../models/project.model.js';

// Create a project
export async function createProject(req, res) {
    try {
        const { title, description, technologies, projectLink } = req.body;
        const freelancer = req.user._id;

        const project = new Project({
            freelancer,
            title,
            description,
            technologies,
            projectLink
        });

        await project.save();
        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        res.status(500).json({ error: 'Error creating project' });
    }
}

// Fetch all projects for a freelancer
export async function getFreelancerProjects(req, res) {
    try {
        const freelancerId = req.user._id;
         // Use the Project model to find all projects by the freelancer
         const projects = await Project.find({ freelancer: freelancerId })
       //console.log("user",freelancerId);
        if (!projects.length) {
            return res.status(404).json({ message: 'No projects found' });
        }

        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching projects' });
    }
}

// Delete a project
export async function deleteProject(req, res) {
    try {
        const projectId = req.params.projectId;
        console.log(projectId)
        const project = await Project.findByIdAndDelete(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        console.log(project)
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting project' });
    }
}
