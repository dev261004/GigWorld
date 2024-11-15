// controllers/portfolioController.js

import {Portfolio} from '../models/portfolio.model.js';
import { User} from "../models/user.model.js"
import {Project} from '../models/project.model.js';

// Create a portfolio
export async function createPortfolio(req, res) {
    try {
        const { bio } = req.body;
        const user = req.user._id;
        const projects = await Project.find({ freelancer: user }).select( "-freelancer -_id ")
        const portfolio = new Portfolio({
            user,
            bio,
            projects
        });

        await portfolio.save();
                // Populate the 'projects' field with actual project details
                // const populatedPortfolio = await Portfolio.findById(portfolio._id).populate('projects');


        res.status(201).json({ message: 'Portfolio created successfully', portfolio });
    } catch (error) {
        res.status(500).json({ error: 'Error creating portfolio' });
    }
}

// Fetch a user's portfolio
export async function getPortfolio(req, res) {
    try {
        const userId = req.params.userId;
        const portfolio = await Portfolio.findOne({ user: userId }).populate('projects')//.populate('user');
        
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        res.status(200).json({ portfolio });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching portfolio' });
    }
}

// Update portfolio
export async function updatePortfolio(req, res) {
    try {
        const { bio} = req.body;
        const user = req.user._id;
        const projects = await Project.find({ freelancer: user }).select( "-freelancer -_id ")
        
        const existingPortfolio = await Portfolio.findOne({ user });
        console.log("exist : ",existingPortfolio);
        const updatedPortfolio = await existingPortfolio.findOneAndUpdate(
            { user },  // Condition: find portfolio by user
            { bio, projects },  // Update data: bio and projects
            { new: true }  // Return the updated portfolio
        ).populate('projects');  // Populate the 'projects' field
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        res.status(200).json({ message: 'Portfolio updated successfully', updatedPortfolio });
    } catch (error) {
        res.status(500).json({ error: 'Error updating portfolio' });
    }
}
