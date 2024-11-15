import {JobApplication} from "../models/jobApplication.model.js";
import { createTransport } from "nodemailer";

// Controller for handling job applications
const applyJob = async (req, res) => {
    const jobId = req.params.id;
    console.log(jobId)
  const { fullName, email, message } = req.body;
  const resume = req.file ? req.file.path : null;

  if (!fullName || !email || !message || !resume) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Save the application to the database
    const newApplication = new JobApplication({
      fullName,
      email,
      message,
      resume,
      job: req.body.jobId,
    });

    await newApplication.save();

    // Send a confirmation email
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "process.env.EMAIL_USER",
      to: email,
      subject: "Job Application Confirmation",
      text: `Hi ${fullName},\n\nYour application has been received. We will get back to you shortly.\n\nBest regards,\nCompany Name,\nWorkHive.Inc`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(200).json({ message: "Job application submitted successfully" });
  } catch (error) {
    console.error("Error saving application:", error);
    res.status(500).json({ message: "Error applying for the job" });
  }
};

export {
  applyJob,
};
