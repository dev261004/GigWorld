// models/Portfolio.js
import mongoose, {Schema} from "mongoose";

const PortfolioSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    projects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Project'
        }
    ],
    bio: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Portfolio= mongoose.model('Portfolio', PortfolioSchema);
