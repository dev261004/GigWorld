import jwt from "jsonwebtoken";
import {Job} from "../models/jobs.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const activeJobConditions = (now = new Date()) => ({
  is_active: { $ne: false },
  $and: [
    {
      $or: [
        { source_website: { $exists: false } },
        { source_website: null },
        { source_website: { $not: /designcrowd/i } },
      ],
    },
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

const isHiddenSource = (source = "") => /designcrowd/i.test(String(source));

const isJobUnavailable = (job, now = new Date()) => (
  !job ||
  job.is_active === false ||
  isHiddenSource(job.source_website) ||
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

const preferenceBudgetRanges = {
  "Under $100": { max: 100 },
  "$100 - $500": { min: 100, max: 500 },
  "$500 - $1000": { min: 500, max: 1000 },
  "$1000+": { min: 1000 },
};

const postedWithinDays = {
  "24h": 1,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

const jobSortOptions = {
  new: { new_until: -1, first_seen_at: -1, postedAt: -1, createdAt: -1 },
  discovered: { first_seen_at: -1, postedAt: -1, createdAt: -1 },
  posted: { postedAt: -1, createdAt: -1 },
  budgetHigh: { "budget.max": -1, "budget.min": -1, postedAt: -1, createdAt: -1 },
  budgetLow: { "budget.min": 1, "budget.max": 1, postedAt: -1, createdAt: -1 },
};

const experiencePatterns = {
  entry: ["entry", "beginner", "fresher", "junior", "no experience"],
  junior: ["junior", "0-2", "1+", "entry"],
  mid: ["mid", "intermediate", "2-5", "2-4"],
  senior: ["senior", "5+", "expert"],
  expert: ["expert", "advanced", "senior"],
};

const categoryKeywords = {
  tech: ["react", "node", "javascript", "python", "mern", "frontend", "backend", "developer", "software", "web", "app", "api", "database"],
  design: ["design", "logo", "figma", "brand", "ui", "ux", "illustrator", "photoshop", "identity", "graphics"],
  writing: ["writing", "writer", "content", "copywriting", "blog", "article", "editing", "proofread"],
  marketing: ["marketing", "seo", "social media", "ads", "campaign", "growth", "email marketing"],
  "data entry": ["data entry", "excel", "spreadsheet", "typing", "copy paste", "admin", "virtual assistant"],
  "customer support": ["customer support", "support", "chat", "email support", "customer service", "helpdesk"],
  "video editing": ["video", "editing", "editor", "youtube", "reels", "premiere", "after effects"],
  tutoring: ["tutor", "teaching", "teacher", "course", "lesson", "education", "training"],
  translation: ["translation", "translator", "localization", "language", "transcription"],
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value = "") => String(value || "").toLowerCase().trim();

const normalizeToken = (value = "") => normalizeText(value).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const normalizeSource = (value = "") =>
  normalizeText(value)
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

const cleanPreferenceList = (values) => toArray(values).map(normalizeToken).filter(Boolean);

const hasTextMatch = (haystack, values) => values.some((value) => value && haystack.includes(value));

const getBudgetBounds = (job) => {
  const min = Number(job?.budget?.min ?? job?.salary_range?.min);
  const max = Number(job?.budget?.max ?? job?.salary_range?.max);

  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  };
};

const budgetMatchesPreference = (job, preferredBudget) => {
  const range = preferenceBudgetRanges[preferredBudget];

  if (!range || preferredBudget === "Any budget") {
    return false;
  }

  const { min, max } = getBudgetBounds(job);

  if (min === null && max === null) {
    return false;
  }

  const jobMin = min ?? max;
  const jobMax = max ?? min;

  if (range.max && !range.min) {
    return jobMin <= range.max || jobMax <= range.max;
  }

  if (range.min && !range.max) {
    return jobMax >= range.min || jobMin >= range.min;
  }

  return jobMin <= range.max && jobMax >= range.min;
};

const workTypeMatchesPreference = (job, preferenceWorkTypes, haystack) => {
  const location = normalizeToken(job?.location);

  return cleanPreferenceList(preferenceWorkTypes).some((workType) => {
    if (workType === "remote") {
      return location.includes("remote") || location.includes("worldwide") || haystack.includes("remote");
    }

    if (workType === "hourly") {
      return job?.budget?.is_hourly === true || haystack.includes("hourly") || haystack.includes("per hour");
    }

    if (workType === "fixed price" || workType === "fixed") {
      return job?.budget?.is_hourly === false || haystack.includes("fixed price") || haystack.includes("fixed");
    }

    if (workType === "short term") {
      return haystack.includes("short term") || haystack.includes("one time") || haystack.includes("quick");
    }

    if (workType === "long term") {
      return haystack.includes("long term") || haystack.includes("ongoing") || haystack.includes("contract");
    }

    return haystack.includes(workType);
  });
};

const sourceMatchesPreference = (jobSource, preferredSources) => {
  const source = normalizeSource(jobSource);

  return toArray(preferredSources).some((preferredSource) => {
    const normalizedPreferred = normalizeSource(preferredSource);
    return normalizedPreferred && (source.includes(normalizedPreferred) || normalizedPreferred.includes(source));
  });
};

const isGigPreferencesIncomplete = (preferences = {}) => !(
  preferences.onboardingCompleted &&
  preferences.currentStatus &&
  toArray(preferences.categories).length > 0 &&
  toArray(preferences.skills).length > 0 &&
  preferences.experienceLevel &&
  toArray(preferences.workTypes).length > 0
);

const getPreferencesFromRequest = async (req) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("gigPreferences").lean();
    return user?.gigPreferences || null;
  } catch {
    return null;
  }
};

const withPreferenceMatch = (job, preferences) => {
  if (!preferences) {
    return {
      ...job,
      preferenceScore: 0,
      preferenceTags: [],
    };
  }

  const tags = [];
  let score = 0;
  const techStack = toArray(job.tech_stack);
  const haystack = normalizeToken([
    job.job_title,
    job.company_name,
    job.location,
    job.experience,
    job.min_requirements,
    job.project_status,
    techStack.join(" "),
  ].join(" "));
  const normalizedSkills = cleanPreferenceList(preferences.skills);
  const normalizedTechStack = cleanPreferenceList(techStack);

  const skillMatches = normalizedSkills.some((skill) =>
    normalizedTechStack.some((tech) => tech.includes(skill) || skill.includes(tech)) ||
    haystack.includes(skill)
  );

  if (skillMatches) {
    score += 5;
    tags.push("Skill match");
  }

  const categoryMatches = cleanPreferenceList(preferences.categories).some((category) => {
    const keywords = categoryKeywords[category] || [category];
    return hasTextMatch(haystack, keywords.map(normalizeToken));
  });

  if (categoryMatches) {
    score += 3;
    tags.push("Category match");
  }

  const workTypeMatches = workTypeMatchesPreference(job, preferences.workTypes, haystack);

  if (workTypeMatches) {
    score += 2;
    tags.push("Work type match");
  }

  const preferredLocation = normalizeToken(preferences.location);
  const jobLocation = normalizeToken(job.location);
  const locationMatches = Boolean(
    preferredLocation &&
    (
      jobLocation.includes(preferredLocation) ||
      preferredLocation.includes(jobLocation) ||
      (preferredLocation.includes("remote") && (jobLocation.includes("remote") || haystack.includes("remote")))
    )
  );

  if (locationMatches) {
    score += 2;
    tags.push("Location match");
  }

  const budgetMatches = budgetMatchesPreference(job, preferences.preferredBudget);

  if (budgetMatches) {
    score += 2;
    tags.push("Budget fit");
  }

  const preferredSourceMatches = sourceMatchesPreference(job.source_website, preferences.preferredSources);

  if (preferredSourceMatches) {
    score += 2;
    tags.push("Preferred source");
  }

  const hasCoreMatch = skillMatches || categoryMatches;
  const filledOptionalSignals = [
    toArray(preferences.workTypes).length > 0,
    Boolean(preferences.location),
    Boolean(preferences.preferredBudget && preferences.preferredBudget !== "Any budget"),
    toArray(preferences.preferredSources).length > 0,
  ];
  const matchedOptionalSignals = [
    workTypeMatches,
    locationMatches,
    budgetMatches,
    preferredSourceMatches,
  ];
  const requiredOptionalCount = filledOptionalSignals.filter(Boolean).length;
  const matchedOptionalCount = matchedOptionalSignals.filter(Boolean).length;

  if (hasCoreMatch && requiredOptionalCount > 0 && matchedOptionalCount === requiredOptionalCount) {
    tags.unshift("Your profile matches");
  } else if (hasCoreMatch && score >= 7) {
    tags.unshift("Recommended for you");
  }

  return {
    ...job,
    preferenceScore: score,
    preferenceTags: [...new Set(tags)],
  };
};

const compareBySortOption = (sortBy) => {
  if (sortBy === "budgetHigh") {
    return (first, second) => (getBudgetBounds(second).max ?? getBudgetBounds(second).min ?? -1) - (getBudgetBounds(first).max ?? getBudgetBounds(first).min ?? -1);
  }

  if (sortBy === "budgetLow") {
    return (first, second) => (getBudgetBounds(first).min ?? getBudgetBounds(first).max ?? Number.MAX_SAFE_INTEGER) - (getBudgetBounds(second).min ?? getBudgetBounds(second).max ?? Number.MAX_SAFE_INTEGER);
  }

  const dateField = sortBy === "discovered" ? "first_seen_at" : sortBy === "posted" ? "postedAt" : "new_until";

  return (first, second) => {
    const secondDate = new Date(second?.[dateField] || second?.postedAt || second?.createdAt || 0).getTime();
    const firstDate = new Date(first?.[dateField] || first?.postedAt || first?.createdAt || 0).getTime();
    return secondDate - firstDate;
  };
};

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
    const { searchKeyword = "", filters = {}, page = 1, perPage = 10, sortBy = "new" } = req.body || {};
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
    const sortConditions = jobSortOptions[sortBy] || jobSortOptions.new;
    const andConditions = [activeJobConditions(now)];
    const gigPreferences = await getPreferencesFromRequest(req);
    const preferencesIncomplete = gigPreferences ? isGigPreferencesIncomplete(gigPreferences) : false;
    
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
      const totalJobs = await Job.countDocuments(filterConditions);

      if (gigPreferences) {
        const allJobs = await Job.find(filterConditions)
          .sort(sortConditions)
          .lean();
        const sortComparator = compareBySortOption(sortBy);
        const rankedJobs = allJobs
          .map((job) => withPreferenceMatch(withComputedJobFlags(job, now), gigPreferences))
          .sort((first, second) => (
            second.preferenceScore - first.preferenceScore || sortComparator(first, second)
          ));
        const paginatedJobs = rankedJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return res.json({ data: paginatedJobs, totalJobs, preferencesIncomplete });
      }

      const jobs = await Job.find(filterConditions)
        .sort(sortConditions)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean();

      return res.json({
        data: jobs.map((job) => withPreferenceMatch(withComputedJobFlags(job, now), null)),
        totalJobs,
        preferencesIncomplete,
      });
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
