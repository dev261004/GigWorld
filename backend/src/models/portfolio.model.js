// models/Portfolio.js
import mongoose, {Schema} from "mongoose";

const linkSchema = new Schema(
    {
        label: {
            type: String,
            trim: true,
            default: ""
        },
        url: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {_id: false}
);

const resumeSchema = new Schema(
    {
        originalName: {
            type: String,
            trim: true,
            default: ""
        },
        fileName: {
            type: String,
            trim: true,
            default: ""
        },
        url: {
            type: String,
            trim: true,
            default: ""
        },
        mimeType: {
            type: String,
            trim: true,
            default: ""
        },
        size: {
            type: Number,
            default: 0
        },
        uploadedAt: {
            type: Date
        },
        generatedAt: {
            type: Date
        }
    },
    {_id: false}
);

const PortfolioSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        projects: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Project'
            }
        ],
        bio: {
            type: String,
            trim: true,
            default: ""
        },
        education: {
            type: String,
            trim: true,
            default: ""
        },
        workExperience: {
            type: String,
            trim: true,
            default: ""
        },
        links: {
            type: [linkSchema],
            default: []
        },
        uploadedResume: {
            type: resumeSchema,
            default: null
        },
        generatedResume: {
            type: resumeSchema,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
