import mongoose, {Schema} from "mongoose";

const contactSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    question: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

export const Contact = mongoose.model('Contact', contactSchema);


