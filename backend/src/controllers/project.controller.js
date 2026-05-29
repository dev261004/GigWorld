// controllers/projectController.js
import { Project } from '../models/project.model.js';

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const cleanTechnologies = (technologies) => {
    if (Array.isArray(technologies)) {
        return [...new Set(technologies.map((tech) => cleanString(tech)).filter(Boolean))];
    }

    if (typeof technologies === "string") {
        return [...new Set(technologies.split(",").map((tech) => cleanString(tech)).filter(Boolean))];
    }

    return [];
};

const getProjectPayload = (body) => ({
    title: cleanString(body.title),
    description: cleanString(body.description),
    technologies: cleanTechnologies(body.technologies),
    projectLink: cleanString(body.projectLink)
});

// Create a project
export async function createProject(req, res) {
    try {
        const freelancer = req.user._id;
        const payload = getProjectPayload(req.body);

        if (!payload.title || !payload.description) {
            return res.status(400).json({ message: "Project title and description are required" });
        }

        const project = new Project({
            freelancer,
            ...payload
        });

        await project.save();
        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: 'Error creating project' });
    }
}

// Fetch all projects for a freelancer
export async function getFreelancerProjects(req, res) {
    try {
        const freelancerId = req.user._id;
        const projects = await Project.find({ freelancer: freelancerId }).sort({ createdAt: -1 });

        res.status(200).json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: 'Error fetching projects' });
    }
}

export async function updateProject(req, res) {
    try {
        const payload = getProjectPayload(req.body);

        if (!payload.title || !payload.description) {
            return res.status(400).json({ message: "Project title and description are required" });
        }

        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.projectId,
                freelancer: req.user._id
            },
            payload,
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project updated successfully', project });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: 'Error updating project' });
    }
}

// Delete a project
export async function deleteProject(req, res) {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.projectId,
            freelancer: req.user._id
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: 'Error deleting project' });
    }
}
