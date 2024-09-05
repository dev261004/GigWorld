import mongoose, {Schema} from "mongoose";

const jobSchema = new Schema({
    job_title: {
        type: String,
        required: true,
    },
    company_name: {
        type: String,
        required: true,
    },
    rating: {
        type: String,
        default: "None",
    },
    experience: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    min_requirements: {
        type: String,
        required: true,
    },
    tech_stack: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true
});

export const Job = mongoose.model('Job', jobSchema);

