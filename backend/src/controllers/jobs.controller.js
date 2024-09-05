import {Job} from "../models/jobs.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get all jobs
const getAllJobs = asyncHandler(async(req, res) => {
    try {
        const jobs = await Job.find();
       return res.status(200).json(new ApiResponse(200,jobs,"getting all jobs"));
    } catch (err) {
     throw new ApiError(500,'Something went wong while getting all jobs');
    }
});

// Get a single job by ID
const getJobById =asyncHandler( async (req, res) => {
    try {
        const jobId = req.params.id;
        console.log(`Looking for job with ID: ${jobId}`);

       
        const job = await Job.findById(jobId);
        console.log(`Query result: ${job}`);
        if (!job) {
            console.error(`Job with ID ${jobId} not found`);
            throw new ApiError(404,"job not found");
        }
        return res.status(200).json(new ApiResponse(200,job,"given id job found"));
        //res.status(200).json(job);
    } catch (err) {
        throw new ApiError(500,"error occuring to find one job");;
    }
});

// Create a new job
const createJob = async (req, res) => {
    try {
        const newJob = new Job(req.body);
        const savedJob = await newJob.save();
        return res.status(201).json(new ApiResponse(201,savedJob,"job created"));
        //res.status(201).json(savedJob);
    } catch (err) {
        throw new ApiError(500,'error creating a new job');
        //res.status(400).json({ error: err.message });
    }
};

// Update a job by ID
const updateJob = async (req, res) => {
    try {
        const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedJob) {
            throw new ApiError(404,"job not found so update not done");
            //return res.status(404).json({ message: 'Job not found' });
        }
        return res.status(200).json(new ApiResponse(200,updatedJob,"job updated"));
       // res.status(200).json(updatedJob);
    } catch (err) {
        throw new ApiError(500,'error updating a job');
       // res.status(400).json({ error: err.message });
    }
};

// Delete a job by ID
const deleteJob = async (req, res) => {
    try {
        const deletedJob = await Job.findByIdAndDelete(req.params.id);
        if (!deletedJob) {
            throw new ApiError(404,"job not found so delete not done");
            //return res.status(404).json({ message: 'Job not found' });
        }
        return res.status(200).json(new ApiResponse(200,deletedJob,"job deleted"));
       // res.status(200).json({ message: 'Job deleted successfully' });
    } catch (err) {
        throw new ApiError(500,'error deleting a job');
        //res.status(500).json({ error: err.message });
    }
};

// Search jobs by keyword
const searchJobsByKeyword = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
  
    if (!keyword) {   
        throw new ApiError(400,"Please provide a keyword to search")      
    }
  
    // Perform the search on job_title, min_requirements, and tech_stack fields
    const jobs = await Job.find({
      $or: [
        { job_title: { $regex: keyword, $options: 'i' } },
        { min_requirements: { $regex: keyword, $options: 'i' } },
        { tech_stack: { $regex: keyword, $options: 'i' } }
      ]
    });
  
    if (jobs.length === 0) {
      return res.status(404).json(new ApiResponse(400, "No jobs found matching the keyword." ));
    }
    return res.status(200).json(new ApiResponse(200,jobs, "found the job" ));
  });
export {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    searchJobsByKeyword
    
}