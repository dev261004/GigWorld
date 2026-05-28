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

const budgetRanges = {
  "<100": { max: 100 },
  "100-500": { min: 100, max: 500 },
  "500-1000": { min: 500, max: 1000 },
  "1000-5000": { min: 1000, max: 5000 },
  "5000+": { min: 5000 },
};

const postedWithinDays = {
  "24h": 1,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

const experiencePatterns = {
  entry: ["entry", "beginner", "fresher", "junior", "no experience"],
  junior: ["junior", "0-2", "1+", "entry"],
  mid: ["mid", "intermediate", "2-5", "2-4"],
  senior: ["senior", "5+", "expert"],
  expert: ["expert", "advanced", "senior"],
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const regexOr = (field, values) => {
  const cleanValues = toArray(values).map((value) => String(value).trim()).filter(Boolean);

  if (cleanValues.length === 0) {
    return null;
  }

  return {
    $or: cleanValues.map((value) => ({
      [field]: { $regex: escapeRegex(value), $options: "i" },
    })),
  };
};

const buildExperienceCondition = (values) => {
  const patterns = toArray(values)
    .flatMap((value) => experiencePatterns[String(value).toLowerCase()] || [value])
    .filter(Boolean);

  return regexOr("experience", patterns);
};

const buildBudgetCondition = (rangeKey) => {
  const range = budgetRanges[rangeKey];

  if (!range) {
    return null;
  }

  const numericFields = [
    { min: "budget.min", max: "budget.max" },
    { min: "salary_range.min", max: "salary_range.max" },
  ];

  if (range.max && !range.min) {
    return {
      $or: numericFields.flatMap((field) => ([
        { [field.min]: { $lte: range.max } },
        { [field.max]: { $lte: range.max } },
      ])),
    };
  }

  if (range.min && !range.max) {
    return {
      $or: numericFields.flatMap((field) => ([
        { [field.min]: { $gte: range.min } },
        { [field.max]: { $gte: range.min } },
      ])),
    };
  }

  return {
    $or: numericFields.flatMap((field) => ([
      { [field.min]: { $gte: range.min, $lte: range.max } },
      { [field.max]: { $gte: range.min, $lte: range.max } },
      { [field.min]: { $lte: range.max }, [field.max]: { $gte: range.min } },
    ])),
  };
};

const buildPostedWithinCondition = (postedWithin, now = new Date()) => {
  const days = postedWithinDays[postedWithin];

  if (!days) {
    return null;
  }

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    $or: [
      { postedAt: { $gte: startDate } },
      { first_seen_at: { $gte: startDate } },
      { scraped_at: { $gte: startDate } },
      { createdAt: { $gte: startDate } },
    ],
  };
};

const cleanOptionList = (values, limit = 30) => (
  values
    .map((value) => String(value || "").trim())
    .filter((value) => value && value.toLowerCase() !== "unknown" && value.toLowerCase() !== "not specified")
    .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .sort((first, second) => first.localeCompare(second))
    .slice(0, limit)
);

const getFilterOptions = asyncHandler(async(req, res) => {
  const now = new Date();
  const baseConditions = activeJobConditions(now);

  const [sourceWebsites, locations, experienceLevels, projectStatuses, skillRows] = await Promise.all([
    Job.distinct("source_website", baseConditions),
    Job.distinct("location", baseConditions),
    Job.distinct("experience", baseConditions),
    Job.distinct("project_status", baseConditions),
    Job.aggregate([
      { $match: baseConditions },
      { $unwind: "$tech_stack" },
      { $group: { _id: "$tech_stack", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 32 },
    ]),
  ]);

  return res.status(200).json({
    data: {
      sourceWebsites: cleanOptionList(sourceWebsites),
      skills: cleanOptionList(skillRows.map((row) => row._id), 32),
      locations: cleanOptionList(locations),
      experienceLevels: cleanOptionList(experienceLevels),
      projectStatuses: cleanOptionList(projectStatuses),
    },
  });
});

// Get all jobs
const getAllJobs = asyncHandler(async(req, res) => {
    // try {
    //     const jobs = await Job.find();
    //    return res.status(200).json(new ApiResponse(200,jobs,"getting all jobs"));
    // } catch (err) {
    //  throw new ApiError(500,'Something went wong while getting all jobs');
    // }
    const { searchKeyword = "", filters = {}, page = 1, perPage = 10 } = req.body || {};
    const {
      location,
      locations = [],
      experience,
      experienceLevels = [],
      techStack,
      skills = [],
      rating,
      min_requirements,
      sources = [],
      budgetRange,
      budgetType = "any",
      postedWithin,
      projectStatuses = [],
    } = filters;
    const now = new Date();
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(perPage) || 10, 1);
    const andConditions = [activeJobConditions(now)];
    
    if (searchKeyword) {
      const searchRegex = { $regex: escapeRegex(searchKeyword), $options: "i" };
      andConditions.push({
        $or: [
          { job_title: searchRegex },
          { company_name: searchRegex },
          { location: searchRegex },
          { min_requirements: searchRegex },
          { tech_stack: searchRegex },
        ],
      });
    }

    [
      regexOr("source_website", sources),
      regexOr("location", [...toArray(location), ...toArray(locations)]),
      buildExperienceCondition([...toArray(experience), ...toArray(experienceLevels)]),
      regexOr("tech_stack", [...toArray(techStack), ...toArray(skills)]),
      regexOr("project_status", projectStatuses),
      buildBudgetCondition(budgetRange),
      buildPostedWithinCondition(postedWithin, now),
      min_requirements ? regexOr("min_requirements", min_requirements) : null,
    ].forEach((condition) => {
      if (condition) {
        andConditions.push(condition);
      }
    });

    if (rating) {
      andConditions.push({ rating: { $gte: parseFloat(rating) } });
    }

    if (budgetType === "hourly") {
      andConditions.push({ "budget.is_hourly": true });
    } else if (budgetType === "fixed") {
      andConditions.push({ "budget.is_hourly": false });
    }

    const filterConditions = { $and: andConditions };
  
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
    getFilterOptions,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    searchJobsByKeyword
    
}
