import { jobApplicationStatus } from "../models/JobApplicationStatus.model.js";


const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in `req.user` after authentication
    const applications = await jobApplicationStatus.find({ user: userId })
      .populate("job", "job_title company_name location") // Populate job details
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export {
    getUserJobApplications
}
