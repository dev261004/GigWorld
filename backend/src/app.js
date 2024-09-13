import express from "express";
import userRouter from './routes/user.routes.js';
import jobsRouter from './routes/jobs.routes.js';
import contactRouter from './routes/contact.route.js'
import companyRouter from './routes/company.routes.js'

import cors from "cors";
import cookieParser from "cookie-parser"
const  app= express();

app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRouter)

app.use("/api/v1/jobs",jobsRouter)

app.use("/api/v1/contact",contactRouter)
app.use("/api/v1/company",companyRouter)
export {app};