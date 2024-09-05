import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Contact } from "../models/contact.model.js";


// Handle contact form submission
const submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, question } = req.body;

    // Basic validation
    if (!name || !email || !question) {
        throw new ApiError(400, "Please fill in all fields");
        //return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Save the contact form details in the database
    const contact = new Contact({ name, email, question });
    await contact.save();

    //return res.status(200).json({ message: 'Contact form submitted successfully.', data: contact });
    return res.status(200).json(new ApiResponse(200, contact,"Contact form submitted successfully."));
});

export { submitContactForm };
