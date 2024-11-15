import express from "express";
import userRouter from './routes/user.routes.js';
import jobsRouter from './routes/jobs.routes.js';
import contactRouter from './routes/contact.route.js'
import companyRouter from './routes/company.routes.js'
import projectRouter from './routes/project.routes.js';
import portfolioRouter from './routes/portfolio.routes.js'
import forgotPasswordRouter from './routes/forgotPassword.js'
import jobApplicationRoutes from './routes/jobApplication.routes.js'
import jobApplicationStatusRouter from './routes/JobApplicationStatus.routes.js'

import cors from "cors";
import cookieParser from "cookie-parser"
import { forgotPassword } from "./controllers/forgotPassword.controller.js";
const  app= express();

// Serve static files (uploaded resumes)
app.use("/uploads", express.static("uploads"));

app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRouter,forgotPasswordRouter)

app.use("/api/v1/jobs",jobsRouter,jobApplicationRoutes)

app.use("/api/v1/contact",contactRouter)
app.use("/api/v1/company",companyRouter)

app.use("/api/v1/applications",jobApplicationStatusRouter)
app.use("/api/v1/projects",projectRouter)

app.use("/api/v1/portfolio",portfolioRouter)
export {app};