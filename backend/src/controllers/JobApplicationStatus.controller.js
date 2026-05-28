import { JobApplication, applicationStatuses } from "../models/jobApplication.model.js";
import { Job } from "../models/jobs.model.js";
import mongoose from "mongoose";

const trackedJobFields = "job_title company_name location experience tech_stack source_website source_url budget project_status postedAt first_seen_at";
const trackedJobAggregationProjection = {
  _id: "$job._id",
  job_title: "$job.job_title",
  company_name: "$job.company_name",
  location: "$job.location",
  experience: "$job.experience",
  tech_stack: "$job.tech_stack",
  source_website: "$job.source_website",
  source_url: "$job.source_url",
  budget: "$job.budget",
  project_status: "$job.project_status",
  postedAt: "$job.postedAt",
  first_seen_at: "$job.first_seen_at",
};

const normalizeStatus = (status) => (
  applicationStatuses.includes(status) ? status : "Viewed source"
);

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePositiveInt = (value, fallback, max = 100) => {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, max);
};

const getReminderMatch = (reminder) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (reminder === "withReminder") {
    return { reminderAt: { $ne: null, $exists: true } };
  }

  if (reminder === "noReminder") {
    return {
      $or: [
        { reminderAt: null },
        { reminderAt: { $exists: false } },
      ],
    };
  }

  if (reminder === "dueToday") {
    return { reminderAt: { $gte: todayStart, $lt: tomorrowStart } };
  }

  if (reminder === "upcoming") {
    return { reminderAt: { $gte: tomorrowStart } };
  }

  if (reminder === "overdue") {
    return { reminderAt: { $lt: todayStart } };
  }

  return {};
};

const buildTrackingPayload = (body = {}, job = null, fallbackStatus = "Viewed source") => {
  const status = normalizeStatus(body.status || fallbackStatus);
  const payload = {
    status,
  };

  const sourceWebsite = body.sourceWebsite || job?.source_website;
  const sourceUrl = body.sourceUrl || job?.source_url;

  if (sourceWebsite) {
    payload.sourceWebsite = sourceWebsite;
  }

  if (sourceUrl) {
    payload.sourceUrl = sourceUrl;
  }

  if (Object.prototype.hasOwnProperty.call(body, "notes")) {
    payload.notes = String(body.notes || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "reminderAt")) {
    payload.reminderAt = body.reminderAt ? new Date(body.reminderAt) : null;
  }

  if (body.sourceOpened) {
    payload.sourceOpenedAt = new Date();
  }

  if (status === "Applied" && !body.keepAppliedAt) {
    payload.appliedAt = new Date();
  }

  return payload;
};

const getUserJobApplications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const page = normalizePositiveInt(req.query.page, 1);
    const perPage = normalizePositiveInt(req.query.perPage, 10, 50);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const source = String(req.query.source || "").trim();
    const reminder = String(req.query.reminder || "all").trim();
    const matchConditions = [];

    if (status && applicationStatuses.includes(status)) {
      matchConditions.push({ status });
    }

    if (source) {
      const sourceRegex = new RegExp(escapeRegex(source), "i");
      matchConditions.push({
        $or: [
          { sourceWebsite: sourceRegex },
          { "job.source_website": sourceRegex },
        ],
      });
    }

    const reminderMatch = getReminderMatch(reminder);
    if (Object.keys(reminderMatch).length > 0) {
      matchConditions.push(reminderMatch);
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      matchConditions.push({
        $or: [
          { status: searchRegex },
          { notes: searchRegex },
          { sourceWebsite: searchRegex },
          { "job.job_title": searchRegex },
          { "job.company_name": searchRegex },
          { "job.location": searchRegex },
          { "job.source_website": searchRegex },
        ],
      });
    }

    const basePipeline = [
      { $match: { userId } },
      {
        $lookup: {
          from: Job.collection.name,
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: {
          path: "$job",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const filterPipeline = matchConditions.length > 0
      ? [{ $match: { $and: matchConditions } }]
      : [];

    const [applicationsResult, sourceOptions] = await Promise.all([
      JobApplication.aggregate([
        ...basePipeline,
        ...filterPipeline,
        {
          $facet: {
            data: [
              { $sort: { updatedAt: -1, createdAt: -1 } },
              { $skip: (page - 1) * perPage },
              { $limit: perPage },
              {
                $project: {
                  jobId: trackedJobAggregationProjection,
                  userId: 1,
                  status: 1,
                  notes: 1,
                  reminderAt: 1,
                  sourceWebsite: 1,
                  sourceUrl: 1,
                  sourceOpenedAt: 1,
                  appliedAt: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            total: [
              { $count: "count" },
            ],
          },
        },
      ]),
      JobApplication.aggregate([
        ...basePipeline,
        {
          $project: {
            source: {
              $cond: [
                { $in: ["$sourceWebsite", [null, "", "unknown"]] },
                "$job.source_website",
                "$sourceWebsite",
              ],
            },
          },
        },
        {
          $match: {
            source: { $nin: [null, "", "unknown"] },
          },
        },
        {
          $group: {
            _id: "$source",
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    const applications = applicationsResult[0]?.data || [];
    const totalApplications = applicationsResult[0]?.total?.[0]?.count || 0;
    const totalPages = Math.max(Math.ceil(totalApplications / perPage), 1);

    res.status(200).json({
      success: true,
      data: applications,
      statuses: applicationStatuses,
      sourceOptions: sourceOptions.map((sourceOption) => sourceOption._id),
      totalApplications,
      currentPage: page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getTrackedJob = async (req, res) => {
  try {
    const tracker = await JobApplication.findOne({
      userId: req.user.id,
      jobId: req.params.jobId,
    }).populate("jobId", trackedJobFields);

    res.status(200).json({
      success: true,
      data: tracker,
      statuses: applicationStatuses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const trackJobApplication = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).lean();

    if (!job) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    const requestedStatus = normalizeStatus(req.body.status || "Viewed source");
    const existingTracker = await JobApplication.findOne({
      userId: req.user.id,
      jobId: req.params.jobId,
    });

    if (existingTracker && requestedStatus === "Applied" && existingTracker.status === "Applied") {
      const tracker = await existingTracker.populate("jobId", trackedJobFields);

      return res.status(200).json({
        success: true,
        data: tracker,
        statuses: applicationStatuses,
        alreadyTracked: true,
        action: "alreadyApplied",
        message: "Gig is already marked as applied",
      });
    }

    if (existingTracker && requestedStatus === "Planning to apply") {
      const tracker = await existingTracker.populate("jobId", trackedJobFields);

      return res.status(200).json({
        success: true,
        data: tracker,
        statuses: applicationStatuses,
        alreadyTracked: true,
        action: existingTracker.status === "Applied" ? "alreadyApplied" : "alreadySaved",
        message: existingTracker.status === "Applied"
          ? "Gig is already marked as applied"
          : "Gig is already saved in your tracker",
      });
    }

    const payload = buildTrackingPayload(req.body, job);
    const tracker = await JobApplication.findOneAndUpdate(
      { userId: req.user.id, jobId: req.params.jobId },
      {
        $set: payload,
        $setOnInsert: {
          userId: req.user.id,
          jobId: req.params.jobId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).populate("jobId", trackedJobFields);

    res.status(200).json({
      success: true,
      data: tracker,
      statuses: applicationStatuses,
      message: "Gig tracking updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateTrackedApplication = async (req, res) => {
  try {
    const currentTracker = await JobApplication.findOne({
      _id: req.params.trackingId,
      userId: req.user.id,
    });

    if (!currentTracker) {
      return res.status(404).json({ success: false, message: "Tracked gig not found" });
    }

    const payload = buildTrackingPayload(req.body, null, currentTracker.status);

    if (payload.status === "Applied" && currentTracker.appliedAt && !req.body.resetAppliedAt) {
      delete payload.appliedAt;
    }

    const tracker = await JobApplication.findOneAndUpdate(
      { _id: req.params.trackingId, userId: req.user.id },
      { $set: payload },
      { new: true, runValidators: true },
    ).populate("jobId", trackedJobFields);

    res.status(200).json({
      success: true,
      data: tracker,
      statuses: applicationStatuses,
      message: "Tracked gig updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteTrackedApplication = async (req, res) => {
  try {
    const tracker = await JobApplication.findOneAndDelete({
      _id: req.params.trackingId,
      userId: req.user.id,
    });

    if (!tracker) {
      return res.status(404).json({ success: false, message: "Tracked gig not found" });
    }

    res.status(200).json({
      success: true,
      data: tracker,
      message: "Tracked gig removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export {
  getTrackedJob,
  getUserJobApplications,
  trackJobApplication,
  updateTrackedApplication,
  deleteTrackedApplication,
};
