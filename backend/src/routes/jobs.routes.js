import { Router } from "express";
const router = Router();
import { getAllJobs,getJobById,createJob,updateJob,deleteJob,searchJobsByKeyword } from "../controllers/jobs.controller.js";

// Get all jobs
router.post('/',getAllJobs);
//router.get('/', jobsController.getAllJobs);

// Get a single job by ID
router.route('/id/:id').get(getJobById);
//router.get('/:id', jobsController.getJobById);

// Create a new job
router.route('/newJob').post(createJob);
//router.post('/', jobsController.createJob);

//update job
router.route("/updateJob/:id").put(updateJob);

//delete job
router.route('/deleteJob/:id').delete(deleteJob)

// Search jobs by keyword
router.get('/search', searchJobsByKeyword);

export default router