import {Job} from "../models/jobs.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const activeJobConditions = (now = new Date()) => ({
  is_active: { $ne: false },
  $and: [
    {
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: now } },
      ],
    },
    {
      $or: [
        { application_deadline: { $exists: false } },
        { application_deadline: null },
        { application_deadline: { $gt: now } },
      ],
    },
  ],
});

const withComputedJobFlags = (job, now = new Date()) => ({
  ...job,
  is_new: Boolean(job.new_until && new Date(job.new_until) > now),
});

const isJobUnavailable = (job, now = new Date()) => (
  !job ||
  job.is_active === false ||
  (job.expires_at && new Date(job.expires_at) <= now) ||
  (job.application_deadline && new Date(job.application_deadline) <= now)
);

// Get all jobs
const getAllJobs = asyncHandler(async(req, res) => {
    // try {
    //     const jobs = await Job.find();
    //    return res.status(200).json(new ApiResponse(200,jobs,"getting all jobs"));
    // } catch (err) {
    //  throw new ApiError(500,'Something went wong while getting all jobs');
    // }
    const { searchKeyword = "", filters = {}, page = 1, perPage = 10 } = req.body || {};
    const { location, experience, techStack, rating, min_requirements } = filters;
    const now = new Date();
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(perPage) || 10, 1);
    
    const filterConditions = {
      ...activeJobConditions(now),
      ...(searchKeyword && { job_title: { $regex: searchKeyword, $options: 'i' } }),
      ...(location && { location: { $regex: location, $options: 'i' } }),
      ...(experience && { experience: { $regex: experience, $options: 'i' } }),
      ...(techStack && { tech_stack: { $in: [techStack] } }),
      ...(rating && { rating: { $gte: parseFloat(rating) } }),
      ...(min_requirements && { min_requirements: { $regex: min_requirements, $options: 'i' } })
    };
  
    try {
      const jobs = await Job.find(filterConditions)
        .sort({ postedAt: -1, createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean();
  
      const totalJobs = await Job.countDocuments(filterConditions);
      res.json({ data: jobs.map((job) => withComputedJobFlags(job, now)), totalJobs });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
});

// Get a single job by ID
const getJobById =asyncHandler( async (req, res) => {
    try {
        const jobId = req.params.id;
       // console.log(`Looking for job with ID: ${jobId}`);

       
        const job = await Job.findById(jobId).lean();
      //  console.log(`Query result: ${job}`);
        if (!job) {
            console.error(`Job with ID ${jobId} not found`);
            throw new ApiError(404,"job not found");
        }
        if (isJobUnavailable(job)) {
            return res.status(410).json(new ApiResponse(410,null,"This gig is no longer available."));
        }
        return res.status(200).json(new ApiResponse(200,withComputedJobFlags(job),"given id job found"));
        //res.status(200).json(job);
    } catch (err) {
        if (err instanceof ApiError) {
            throw err;
        }
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
    const now = new Date();
    const jobs = await Job.find({
      ...activeJobConditions(now),
      $or: [
        { job_title: { $regex: keyword, $options: 'i' } },
        { min_requirements: { $regex: keyword, $options: 'i' } },
        { tech_stack: { $regex: keyword, $options: 'i' } }
      ]
    }).lean();
  
    if (jobs.length === 0) {
      return res.status(404).json(new ApiResponse(400, "No jobs found matching the keyword." ));
    }
    return res.status(200).json(new ApiResponse(200,jobs.map((job) => withComputedJobFlags(job, now)), "found the job" ));
  });
  
export {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    searchJobsByKeyword
    
}
