import { Company } from "../models/company.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// Register a new company
const registerCompany = asyncHandler(async (req, res) => {
    const { company_name, location, industry, website, contact_info, company_mail } = req.body;

    if ([company_name, location, industry, contact_info, company_mail].some(field => !field || String(field).trim() === "")) {
        throw new ApiError(400, "All fields except 'website' are required");
    }

    const existedCompany = await Company.findOne({ company_mail });

    if (existedCompany) {
        throw new ApiError(409, "Company with this email already exists");
    }

    const company = await Company.create({ company_name, location, industry, website, contact_info, company_mail });

    return res.status(201).json(new ApiResponse(200, company, "Company registered successfully"));
});

// Get company by ID
const getCompany = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(new ApiResponse(200, company, "Company details fetched successfully"));
});

// Update company details
const updateCompany = asyncHandler(async (req, res) => {
    const { company_name, location, industry, website, contact_info, company_mail } = req.body;

    const company = await Company.findByIdAndUpdate(req.params.id, {
        company_name, location, industry, website, contact_info, company_mail
    }, { new: true });

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(new ApiResponse(200, company, "Company updated successfully"));
});

// Delete company
const deleteCompany = asyncHandler(async (req, res) => {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Company deleted successfully"));
});

export {
    registerCompany,
    getCompany,
    updateCompany,
    deleteCompany
};
