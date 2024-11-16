// controllers/portfolioController.js

import {Portfolio} from '../models/portfolio.model.js';
import { User} from "../models/user.model.js"
import {Project} from '../models/project.model.js';

// Create a portfolio
export async function createPortfolio(req, res) {
    try {
        const { bio } = req.body;
        const user = req.user._id;

        // Find projects associated with the logged-in user
        const projects = await Project.find({ freelancer: user }).select("-freelancer -_id");
        console.log("projects:",projects)
        if (!projects.length) {
            return res.status(404).json({ message: 'No projects found for the user.' });
        }

        // Create a new portfolio
        const portfolio = new Portfolio({
            user,
            bio,
            projects
        });

        await portfolio.save();

        res.status(201).json({ message: 'Portfolio created successfully', portfolio });
    } catch (error) {
        console.error("Error creating portfolio:", error);
        res.status(500).json({ error: 'Error creating portfolio' });
    }
}


// Fetch a user's portfolio
export async function getPortfolio(req, res) {
    try {
        const userId = req.params.userId;

        // Fetch the portfolio along with the populated projects
        const portfolio = await Portfolio.findOne({ user: userId }).populate('projects');
        console.log('portfolio',portfolio)
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        res.status(200).json({ portfolio });
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ error: 'Error fetching portfolio' });
    }
}


// Update portfolio
export async function updatePortfolio(req, res) {
    try {
        const { bio } = req.body;
        const user = req.user._id;
         console.log("u",user)
        // Fetch associated projects
        const projects = await Project.find({ freelancer: user }).select("-freelancer -_id");
        if (!projects.length) {
            return res.status(404).json({ message: 'No projects found for the user.' });
        }

        // Check if portfolio exists for the user
        const existingPortfolio = await Portfolio.findOne({ user });
        if (!existingPortfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        // Update the portfolio
        const updatedPortfolio = await Portfolio.findOneAndUpdate(
            { user },
            { bio, projects },
            { new: true }
        ).populate('projects');

        res.status(200).json({ message: 'Portfolio updated successfully', updatedPortfolio });
    } catch (error) {
        console.error("Error updating portfolio:", error);
        res.status(500).json({ error: 'Error updating portfolio' });
    }
}

