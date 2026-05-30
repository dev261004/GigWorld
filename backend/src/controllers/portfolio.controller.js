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
const formatEducationYear = (value = "") => {
    const cleanedValue = cleanString(value);

    if (/^\d{4}-\d{2}$/.test(cleanedValue)) {
        const [year, month] = cleanedValue.split("-").map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric"
        });
    }

    return cleanedValue;
};
const cleanMarksValue = (value = "") => cleanString(value).replace(/\s*(%|cgpa)$/i, "").trim();
const normalizeMarksType = (value = "", marks = "") => {
    if (value === "cgpa" || /cgpa/i.test(marks)) {
        return "cgpa";
    }

    return "percentage";
};
const formatMarks = (marks = "", marksType = "percentage") => {
    const cleanedMarks = cleanMarksValue(marks);

    if (!cleanedMarks) {
        return "";
    }

    return marksType === "cgpa" ? `${cleanedMarks} CGPA` : `${cleanedMarks}%`;
};

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

const cleanEducationDetails = (educationDetails) => {
    if (!Array.isArray(educationDetails)) {
        return [];
    }

    return educationDetails
        .map((entry) => ({
            institutionName: cleanString(entry.institutionName),
            degreeName: cleanString(entry.degreeName),
            year: cleanString(entry.year),
            marks: cleanMarksValue(entry.marks),
            marksType: normalizeMarksType(entry.marksType, entry.marks),
            location: cleanString(entry.location)
        }))
        .filter((entry) =>
            entry.institutionName ||
            entry.degreeName ||
            entry.year ||
            entry.marks ||
            entry.location
        );
};

const cleanWorkExperienceDetails = (workExperienceDetails) => {
    if (!Array.isArray(workExperienceDetails)) {
        return [];
    }

    return workExperienceDetails
        .map((entry) => ({
            companyName: cleanString(entry.companyName),
            designation: cleanString(entry.designation),
            startDate: cleanString(entry.startDate),
            endDate: cleanString(entry.endDate),
            location: cleanString(entry.location),
            isRemote: Boolean(entry.isRemote),
            whatLearned: cleanString(entry.whatLearned)
        }))
        .filter((entry) =>
            entry.companyName ||
            entry.designation ||
            entry.startDate ||
            entry.endDate ||
            entry.location ||
            entry.isRemote ||
            entry.whatLearned
        );
};

const buildEducationSummary = (educationDetails, fallbackEducation) => {
    const cleanedDetails = cleanEducationDetails(educationDetails);

    if (!cleanedDetails.length) {
        return cleanString(fallbackEducation);
    }

    return cleanedDetails
        .map((entry) => {
            const title = [entry.degreeName, entry.institutionName].filter(Boolean).join(" - ");
            const meta = [
                entry.year ? `Year: ${formatEducationYear(entry.year)}` : "",
                entry.marks ? `Marks: ${formatMarks(entry.marks, entry.marksType)}` : "",
                entry.location ? `Location: ${entry.location}` : ""
            ].filter(Boolean);

            return [title, meta.join(", ")].filter(Boolean).join("\n");
        })
        .join("\n\n");
};

const buildWorkExperienceSummary = (workExperienceDetails, fallbackWorkExperience) => {
    const cleanedDetails = cleanWorkExperienceDetails(workExperienceDetails);

    if (!cleanedDetails.length) {
        return cleanString(fallbackWorkExperience);
    }

    return cleanedDetails
        .map((entry) => {
            const title = [entry.designation, entry.companyName].filter(Boolean).join(" - ");
            const duration = [formatEducationYear(entry.startDate), formatEducationYear(entry.endDate) || (entry.startDate ? "Present" : "")]
                .filter(Boolean)
                .join(" to ");
            const location = entry.isRemote ? "Remote" : entry.location;
            const meta = [
                duration ? `Duration: ${duration}` : "",
                location ? `Location: ${location}` : ""
            ].filter(Boolean);
            const learned = entry.whatLearned ? `What learned: ${entry.whatLearned}` : "";

            return [title, meta.join(", "), learned].filter(Boolean).join("\n");
        })
        .join("\n\n");
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
        const { bio, education, educationDetails, workExperience, workExperienceDetails, links } = req.body;
        const portfolio = await getPortfolioDocument(userId);
        const cleanedEducationDetails = cleanEducationDetails(educationDetails);
        const cleanedWorkExperienceDetails = cleanWorkExperienceDetails(workExperienceDetails);

        portfolio.bio = cleanString(bio);
        portfolio.educationDetails = cleanedEducationDetails;
        portfolio.education = buildEducationSummary(cleanedEducationDetails, education);
        portfolio.workExperienceDetails = cleanedWorkExperienceDetails;
        portfolio.workExperience = buildWorkExperienceSummary(cleanedWorkExperienceDetails, workExperience);
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
