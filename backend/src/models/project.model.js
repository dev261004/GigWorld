// models/Project.js
import mongoose, {Schema} from "mongoose";

const ProjectSchema = new Schema({
    freelancer: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    technologies: [
        {
            type: String,
            required: true
        }
    ],
    projectLink: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


export const Project = mongoose.model("Project", ProjectSchema)
