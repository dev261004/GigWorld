import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:2610/api/v1/company", // Replace with your backend URL
});

// API Endpoints
export const getCompanies = () => API.get("/companies");
export const getCompanyById = (id) => API.get(`/companies/${id}`);
export const registerCompany = (data) => API.post("/companies", data);
export const updateCompany = (id, data) => API.put(`/companies/${id}`, data);
export const deleteCompany = (id) => API.delete(`/companies/${id}`);
