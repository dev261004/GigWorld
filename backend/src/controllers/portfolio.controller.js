// controllers/portfolioController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Portfolio } from "../models/portfolio.model.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { buildResumeHtml } from "../utils/resumeHtmlTemplate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const resumeUploadDir = path.join(backendRoot, "public", "uploads", "resumes");
const generatedResumeDir = path.join(backendRoot, "public", "uploads", "generated-resumes");

const ensureDirectory = (directoryPath) => {
    fs.mkdirSync(directoryPath, { recursive: true });
};

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const cleanLinks = (links) => {
    if (!Array.isArray(links)) {
        return [];
    }

    return links
        .map((link) => ({
            label: cleanString(link.label),
            url: cleanString(link.url)
        }))
        .filter((link) => link.label || link.url);
};

const getPortfolioDocument = async (userId) => {
    let portfolio = await Portfolio.findOne({ user: userId }).populate("projects");

    if (!portfolio) {
        portfolio = await Portfolio.create({
            user: userId,
            bio: "",
            projects: []
        });
        portfolio = await portfolio.populate("projects");
    }

    return portfolio;
};

const getPortfolioPayload = async (userId) => {
    const [portfolio, user, projects] = await Promise.all([
        getPortfolioDocument(userId),
        User.findById(userId).select("-password -refreshToken"),
        Project.find({ freelancer: userId }).sort({ createdAt: -1 })
    ]);

    portfolio.projects = projects.map((project) => project._id);
    await portfolio.save();

    const hydratedPortfolio = await Portfolio.findById(portfolio._id).populate("projects");

    return {
        portfolio: hydratedPortfolio,
        user
    };
};

export const resumeUpload = multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => {
            ensureDirectory(resumeUploadDir);
            cb(null, resumeUploadDir);
        },
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-");
            cb(null, `${req.user._id}-${Date.now()}-${safeName}`);
        }
    }),
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    fileFilter: (_, file, cb) => {
        const allowedMimeTypes = new Set([
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]);
        const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
        const extension = path.extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) {
            cb(null, true);
            return;
        }

        cb(new Error("Only PDF, DOC, and DOCX resumes are supported"));
    }
});

export async function getMyPortfolio(req, res) {
    try {
        const payload = await getPortfolioPayload(req.user._id);
        res.status(200).json(payload);
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ error: "Error fetching portfolio" });
    }
}

export async function saveMyPortfolio(req, res) {
    try {
        const userId = req.user._id;
        const { bio, education, workExperience, links } = req.body;
        const portfolio = await getPortfolioDocument(userId);

        portfolio.bio = cleanString(bio);
        portfolio.education = cleanString(education);
        portfolio.workExperience = cleanString(workExperience);
        portfolio.links = cleanLinks(links);
        portfolio.projects = await Project.find({ freelancer: userId }).distinct("_id");

        await portfolio.save();

        const payload = await getPortfolioPayload(userId);
        res.status(200).json({ message: "Portfolio saved successfully", ...payload });
    } catch (error) {
        console.error("Error saving portfolio:", error);
        res.status(500).json({ error: "Error saving portfolio" });
    }
}

export async function uploadResume(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" });
        }

        const portfolio = await getPortfolioDocument(req.user._id);
        portfolio.uploadedResume = {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            url: `/uploads/resumes/${req.file.filename}`,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date()
        };

        await portfolio.save();

        const payload = await getPortfolioPayload(req.user._id);
        res.status(200).json({ message: "Resume uploaded successfully", ...payload });
    } catch (error) {
        console.error("Error uploading resume:", error);
        res.status(500).json({ error: "Error uploading resume" });
    }
}

export async function generateResume(req, res) {
    try {
        const { portfolio, user } = await getPortfolioPayload(req.user._id);
        const projects = portfolio.projects || [];
        const html = buildResumeHtml({ user, portfolio, projects });

        ensureDirectory(generatedResumeDir);

        let browser;
        try {
            const { default: puppeteer } = await import("puppeteer");

            browser = await puppeteer.launch({
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            const page = await browser.newPage();
            await page.setContent(html, {
                waitUntil: "networkidle0"
            });

            const generatedFileName = `${req.user._id}-${Date.now()}-generated-resume.pdf`;
            const generatedPath = path.join(generatedResumeDir, generatedFileName);

            await page.pdf({
                path: generatedPath,
                format: "letter",
                printBackground: true,
                margin: {
                    top: "2cm",
                    right: "2cm",
                    bottom: "2cm",
                    left: "2cm"
                }
            });

            portfolio.generatedResume = {
                originalName: "GigWorld generated resume.pdf",
                fileName: generatedFileName,
                url: `/uploads/generated-resumes/${generatedFileName}`,
                mimeType: "application/pdf",
                size: fs.statSync(generatedPath).size,
                generatedAt: new Date()
            };

            await portfolio.save();

            const payload = await getPortfolioPayload(req.user._id);
            res.status(200).json({ message: "Resume generated successfully", ...payload });
        } catch (generationError) {
            console.error("Resume HTML/PDF generation failed:", generationError);
            return res.status(501).json({
                message: "Resume generation needs Puppeteer installed and a browser available on the server. Upload/view/download still works."
            });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    } catch (error) {
        console.error("Error generating resume:", error);
        res.status(500).json({ error: "Error generating resume" });
    }
}

// Backward-compatible routes used by older frontend screens.
export async function createPortfolio(req, res) {
    return saveMyPortfolio(req, res);
}

export async function getPortfolio(req, res) {
    try {
        const payload = await getPortfolioPayload(req.params.userId);
        res.status(200).json(payload);
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ error: "Error fetching portfolio" });
    }
}

export async function updatePortfolio(req, res) {
    return saveMyPortfolio(req, res);
}
